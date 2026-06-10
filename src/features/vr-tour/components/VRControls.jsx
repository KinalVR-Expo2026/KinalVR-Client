import { useEffect, useRef } from 'react';

// Aseguramos que AFRAME exista en el scope global antes de registrar
if (typeof window !== 'undefined' && window.AFRAME) {
  const AFRAME = window.AFRAME;
  const THREE = window.THREE || AFRAME.THREE;

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

  // 4. Ocultar la línea
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
}

export const VRControls = ({ cameraRef, cameraYaw }) => {
  const wrapperRef = useRef(null);

  // Sincronizar el yaw (rotación Y) sin que React sobreescriba cada frame
  useEffect(() => {
    if (wrapperRef.current && window.AFRAME) {
      const THREE = window.THREE || window.AFRAME.THREE;
      wrapperRef.current.object3D.rotation.y = THREE.MathUtils.degToRad(cameraYaw);
    }
  }, [cameraYaw]);

  return (
    <a-entity id="camera-wrapper" ref={wrapperRef}>
      <a-entity
        camera
        ref={cameraRef}
        look-controls="reverseMouseDrag: false"
        position="0 1.6 0"
      ></a-entity>

      {/* Mano Izquierda */}
      <a-entity
        hand-tracking-controls="hand: left"
        laser-controls="hand: left"
        raycaster="objects: .clickable; far: 50; showLine: true"
        vr-only-line="color: #f97316; opacity: 0.7"
        thumbstick-turning="turnAngle: 45"
        hand-pinch-click
        hand-joystick-turn="speed: 1.5; deadzone: 0.02"
      ></a-entity>

      {/* Mano Derecha */}
      <a-entity
        hand-tracking-controls="hand: right"
        laser-controls="hand: right"
        raycaster="objects: .clickable; far: 50; showLine: true"
        vr-only-line="color: #f97316; opacity: 0.7"
        thumbstick-turning="turnAngle: 45"
        hand-pinch-click
        hand-joystick-turn="speed: 1.5; deadzone: 0.02"
      ></a-entity>
    </a-entity>
  );
};