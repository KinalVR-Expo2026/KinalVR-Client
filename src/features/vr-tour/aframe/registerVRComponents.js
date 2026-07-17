// Registro centralizado de los componentes A-Frame del tour: controles de
// cámara/manos (giro con joystick físico o virtual, click por pellizco, recarga
// con botón A) y sincronización de la brújula del minimapa. Antes vivían inline
// a nivel de módulo en VRControls.jsx; se extrajeron aquí para aligerar ese
// componente y poder reutilizar la matemática de rotación desde el minimapa 3D.
//
// `registerVRComponents()` es idempotente (cada registro está protegido por
// `if (!AFRAME.components[...])`), así que es seguro llamarla en cada montaje.

// Calcula, en grados CSS, hacia dónde mira la cámara para orientar la flecha del
// minimapa. Combina la rotación de look-controls (el propio `el`) con la del rig
// padre (#camera-wrapper, que cambia al teletransportarse), invierte el signo
// (A-Frame gira al revés que rotate() de CSS) y suma la calibración de la escena
// (`offsetDeg`, de coordinacionAngulo) más 180° de alineación de eje.
// Fuente única de la fórmula: la usan `minimap-sync` (escritor de la variable
// CSS del minimapa HTML) y el minimapa 3D de VR.
export const computeMinimapDegrees = (el, offsetDeg = 0) => {
  const THREE = window.THREE || window.AFRAME.THREE;
  let totalRotationY = el.object3D.rotation.y;

  if (el.parentEl && el.parentEl.object3D) {
    totalRotationY += el.parentEl.object3D.rotation.y;
  }

  return -(THREE.MathUtils.radToDeg(totalRotationY)) + offsetDeg + 180;
};

export const registerVRComponents = () => {
  if (typeof window === 'undefined' || !window.AFRAME) return;

  const AFRAME = window.AFRAME;
  const THREE = window.THREE || AFRAME.THREE;

  // Parche para habilitar la rotación vertical (pitch) al arrastrar el dedo en móviles
  if (AFRAME.components['look-controls']) {
    AFRAME.components['look-controls'].Component.prototype.onTouchMove = function (evt) {
      if (!this.touchStarted || !this.data.touchEnabled) { return; }

      var canvas = this.el.sceneEl.canvas;
      var yawObject = this.yawObject;
      var pitchObject = this.pitchObject;

      // Movimiento horizontal (yaw)
      var deltaX = 2 * Math.PI * (evt.touches[0].pageX - this.touchStart.x) / canvas.clientWidth;
      // Movimiento vertical (pitch)
      var deltaY = 2 * Math.PI * (evt.touches[0].pageY - this.touchStart.y) / canvas.clientHeight;

      var direction = this.data.reverseTouchDrag ? 1 : -1;

      // Aplicar rotaciones (sensibilidad restaurada a 0.5)
      yawObject.rotation.y -= deltaX * 0.5 * direction;
      pitchObject.rotation.x -= deltaY * 0.5 * direction;

      // Limitar pitch para no girar de cabeza (-90deg a 90deg)
      var maxPitch = Math.PI / 2;
      pitchObject.rotation.x = Math.max(-maxPitch, Math.min(maxPitch, pitchObject.rotation.x));

      this.touchStart = {
        x: evt.touches[0].pageX,
        y: evt.touches[0].pageY
      };
    };
  }

  if (!AFRAME.components['reload-on-a-button']) {
    AFRAME.registerComponent('reload-on-a-button', {
      init: function () {
        this.onAButton = () => {
          window.location.reload();
        };
        this.el.addEventListener('abuttondown', this.onAButton);
      },
      remove: function () {
        this.el.removeEventListener('abuttondown', this.onAButton);
      }
    });
  }

  // 1. Giro con los joysticks físicos
  if (!AFRAME.components['thumbstick-turning']) {
    AFRAME.registerComponent('thumbstick-turning', {
      schema: {
        rigSelector: { type: 'string', default: '#camera-wrapper' },
        turnAngle: { type: 'number', default: 45 }
      },
      init: function () {
        this.rig = document.querySelector(this.data.rigSelector);
        this.isTurning = false;

        this.el.addEventListener('thumbstickmoved', (evt) => {
          if (!this.rig) return;
          const x = evt.detail.x;

          if (x > 0.6 && !this.isTurning) {
            this.rig.object3D.rotation.y -= THREE.MathUtils.degToRad(this.data.turnAngle);
            this.isTurning = true;
          } else if (x < -0.6 && !this.isTurning) {
            this.rig.object3D.rotation.y += THREE.MathUtils.degToRad(this.data.turnAngle);
            this.isTurning = true;
          } else if (Math.abs(x) < 0.2) {
            this.isTurning = false;
          }
        });
      }
    });
  }

  // 2. Click con el gesto de pellizco
  if (!AFRAME.components['hand-pinch-click']) {
    AFRAME.registerComponent('hand-pinch-click', {
      init: function () {
        this.el.addEventListener('pinchstarted', () => {
          const raycaster = this.el.components.raycaster;
          if (raycaster && raycaster.intersectedEls.length > 0) {
            const target = raycaster.intersectedEls[0];
            target.emit('click');
            target.emit('mousedown'); // Para el ConnectionMarker
          }
        });
      }
    });
  }

  // 3. Joystick Virtual con Seguimiento de Manos
  if (!AFRAME.components['hand-joystick-turn']) {
    AFRAME.registerComponent('hand-joystick-turn', {
      schema: {
        rigSelector: { type: 'string', default: '#camera-wrapper' },
        speed: { type: 'number', default: 1.5 },
        deadzone: { type: 'number', default: 0.02 } // 2 cm de zona muerta para no girar sin querer
      },
      init: function () {
        this.rig = document.querySelector(this.data.rigSelector);
        this.isJoySticking = false;
        this.pinchCenterX = 0;

        this.el.addEventListener('pinchstarted', () => {
          // Si estamos apuntando a una flecha u objeto, es un click normal, no activamos el joystick
          const raycaster = this.el.components.raycaster;
          if (raycaster && raycaster.intersectedEls.length > 0) return;

          this.isJoySticking = true;
          // Guardamos el punto central del joystick virtual (la posición de la mano al empezar)
          this.pinchCenterX = this.el.object3D.position.x;
        });

        this.el.addEventListener('pinchended', () => {
          this.isJoySticking = false;
        });
      },
      tick: function (time, timeDelta) {
        if (this.isJoySticking && this.rig) {
          const currentX = this.el.object3D.position.x;
          const deltaX = currentX - this.pinchCenterX; // Distancia desde el centro del joystick

          // Si la mano se mueve más allá de la zona muerta, empezamos a rotar
          if (Math.abs(deltaX) > this.data.deadzone) {
            // El giro es continuo y la velocidad depende de qué tan lejos muevas la mano del centro
            const rotationSpeed = (deltaX > 0 ? deltaX - this.data.deadzone : deltaX + this.data.deadzone);
            // Multiplicamos por la velocidad y ajustamos por el framerate
            const turnAmount = rotationSpeed * this.data.speed * (timeDelta / 16.666);
            this.rig.object3D.rotation.y -= turnAmount;
          }
        }
      }
    });
  }

  // 4. Sincronizar la flecha del minimapa con la rotación real de la cámara (sin re-render de React)
  if (!AFRAME.components['minimap-sync']) {
    AFRAME.registerComponent('minimap-sync', {
      tick: function () {
        const offset = parseFloat(this.el.getAttribute('data-offset')) || 0;
        const degrees = computeMinimapDegrees(this.el, offset);

        const minimapEl = document.getElementById('minimap-container');
        if (minimapEl) {
          minimapEl.style.setProperty('--minimap-rotation', `${degrees}deg`);
        }
      }
    });
  }

  // 5. Panel que siempre rota para mirar al usuario (paneles de evento y mapa en VR)
  if (!AFRAME.components['billboard']) {
    AFRAME.registerComponent('billboard', {
      tick: function () {
        const camera = this.el.sceneEl.camera;
        if (!camera) return;

        const camWPos = new THREE.Vector3();
        camera.getWorldPosition(camWPos);

        const panelWPos = new THREE.Vector3();
        this.el.object3D.getWorldPosition(panelWPos);

        const dx = camWPos.x - panelWPos.x;
        const dz = camWPos.z - panelWPos.z;
        this.el.object3D.rotation.y = Math.atan2(dx, dz);
      }
    });
  }

  // 6. Teñir el modelo del mando con un color de marca. Los mandos Touch son
  // plástico oscuro, así que un tinte por multiplicación (material.color) no se
  // nota; se usa `emissive` (brillo propio) para que el color sí resalte. Se
  // aplica cuando el modelo del control termina de cargar (controllermodelready /
  // model-loaded), recorriendo sus mallas.
  if (!AFRAME.components['controller-tint']) {
    AFRAME.registerComponent('controller-tint', {
      schema: {
        color: { type: 'color', default: '#ffffff' },
        intensity: { type: 'number', default: 0.6 }
      },
      init: function () {
        this.applyTint = () => {
          const root = this.el.getObject3D('mesh') || this.el.object3D;
          if (!root) return;
          const col = new THREE.Color(this.data.color);
          root.traverse((node) => {
            if (!node.isMesh || !node.material) return;
            const mats = Array.isArray(node.material) ? node.material : [node.material];
            mats.forEach((m) => {
              if (m.emissive) {
                m.emissive.copy(col);
                m.emissiveIntensity = this.data.intensity;
                m.needsUpdate = true;
              }
            });
          });
        };
        this.el.addEventListener('controllermodelready', this.applyTint);
        this.el.addEventListener('model-loaded', this.applyTint);
      },
      remove: function () {
        this.el.removeEventListener('controllermodelready', this.applyTint);
        this.el.removeEventListener('model-loaded', this.applyTint);
      }
    });
  }

  // 7. Ocultar la línea del laser fuera de VR
  if (!AFRAME.components['vr-only-line']) {
    AFRAME.registerComponent('vr-only-line', {
      schema: {
        color: { type: 'color', default: '#f97316' },
        opacity: { type: 'number', default: 0.7 }
      },
      init: function () {
        const applyVisibility = (isVR) => {
          this.el.setAttribute('line', {
            color: this.data.color,
            opacity: isVR ? this.data.opacity : 0,
            visible: isVR
          });
        };

        if (this.el.sceneEl && this.el.sceneEl.is('vr-mode')) {
          applyVisibility(true);
        } else {
          applyVisibility(false);
        }

        this.onEnterVR = () => applyVisibility(true);
        this.onExitVR = () => applyVisibility(false);

        this.el.sceneEl.addEventListener('enter-vr', this.onEnterVR);
        this.el.sceneEl.addEventListener('exit-vr', this.onExitVR);
      },
      remove: function () {
        if (this.el.sceneEl) {
          this.el.sceneEl.removeEventListener('enter-vr', this.onEnterVR);
          this.el.sceneEl.removeEventListener('exit-vr', this.onExitVR);
        }
      }
    });
  }

  // 8. El botón Y del mando izquierdo alterna el mapa del campus en VR
  // (el botón menú ☰ está reservado por el sistema del Quest).
  if (!AFRAME.components['map-toggle-button']) {
    AFRAME.registerComponent('map-toggle-button', {
      init: function () {
        this.onYButton = () => window.dispatchEvent(new CustomEvent('vr-map-toggle'));
        this.el.addEventListener('ybuttondown', this.onYButton);
      },
      remove: function () {
        this.el.removeEventListener('ybuttondown', this.onYButton);
      }
    });
  }
};
