import { getPlanTexture, releasePlanTexture } from '../utils/planTextures';
import { computeMinimapDegrees } from './registerVRComponents';
import { buildArrowGeometry } from './arrowGeometry';
import { useTourStore } from '../store/useTourStore';
import { LEVEL_TO_NUM } from '../constants/campusMap';

// Componente A-Frame del minimapa 3D "de muñeca" para la experiencia inmersiva.
// Es la contraparte en VR del MinimapWidget HTML (que no se renderiza dentro del
// casco). Muestra un disco tipo radar con el plano del nivel centrado en la
// posición del usuario y una flecha que apunta hacia donde mira la cámara.
//
// Estructura: se construye 100% con THREE dentro de un grupo (setObject3D), sin
// entidades A-Frame hijas, para evitar problemas de timing y controlar el orden
// de dibujo. Los datos de la escena se leen del store de Zustand con getState()
// (sin props ni re-render de React), igual que hace minimap-sync con el DOM.
//
// Nota: las medidas/posiciones/sentido de giro son ajustables — requieren una
// pasada de calibración con casco o emulador WebXR.

const UPDATE_MS = 45;  // ~22 Hz: suficiente para el radar, barato para el tick

export const registerVRMinimap = () => {
  if (typeof window === 'undefined' || !window.AFRAME) return;
  if (window.AFRAME.components['vr-minimap']) return;

  const AFRAME = window.AFRAME;
  const THREE = window.THREE || AFRAME.THREE;

  AFRAME.registerComponent('vr-minimap', {
    // Ajustable por atributo (calibrable en casco/consola sin recompilar):
    //   radius: radio del disco (m); zoom: fracción del plano visible (≈450% HTML);
    //   flipArrow: invertir el sentido de giro de la flecha si apunta al revés.
    schema: {
      radius: { type: 'number', default: 0.05 },
      zoom: { type: 'number', default: 0.22 },
      flipArrow: { type: 'boolean', default: false }
    },

    init: function () {
      this.THREE = THREE;
      this.currentLevel = null;
      this.lastUpdate = 0;
      this.tex = null; // textura activa (una sola a la vez, se libera al cambiar de nivel)
      this.cameraEl = this.el.sceneEl.querySelector('[camera]');

      const radius = this.data.radius;
      const group = new THREE.Group();

      // Respaldo del disco: el plano ahora es transparente (webp con alfa), así que
      // sin este fondo se verían las líneas del plano flotando sobre la escena.
      const backing = new THREE.Mesh(
        new THREE.CircleGeometry(radius, 48),
        new THREE.MeshBasicMaterial({ color: 0x0c0f1e, transparent: true, opacity: 0.82 })
      );
      backing.position.z = -0.0005;
      group.add(backing);

      // Disco del plano (radar). transparent para respetar el alfa del webp.
      this.planoMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true });
      const plano = new THREE.Mesh(new THREE.CircleGeometry(radius, 48), this.planoMaterial);
      group.add(plano);

      // Anillo de borde.
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(radius, radius * 1.12, 48),
        new THREE.MeshBasicMaterial({ color: 0x4b6ccc, side: THREE.DoubleSide })
      );
      ring.position.z = 0.0005;
      group.add(ring);

      // Flecha: triángulo blanco (borde) + triángulo azul encima (relleno),
      // replicando el diseño del MinimapArrow. Factores calibrables en casco.
      const arrow = new THREE.Group();
      const arrowBack = new THREE.Mesh(
        buildArrowGeometry(THREE, (radius * 1.0) / 100),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      arrowBack.position.z = 0.001;
      const arrowFront = new THREE.Mesh(
        buildArrowGeometry(THREE, (radius * 0.8) / 100),
        new THREE.MeshBasicMaterial({ color: 0x20346b })
      );
      arrowFront.position.z = 0.0015;
      arrow.add(arrowBack, arrowFront);
      this.arrow = arrow;
      group.add(arrow);

      this.group = group;
      this.el.setObject3D('minimap', group);

      // Solo visible dentro de VR (mismo criterio que vr-only-line).
      const sceneEl = this.el.sceneEl;
      this.inVR = sceneEl.is('vr-mode');
      group.visible = false; // se decide en el primer tick según haya posición
      this.onEnterVR = () => { this.inVR = true; };
      this.onExitVR = () => { this.inVR = false; this.group.visible = false; };
      sceneEl.addEventListener('enter-vr', this.onEnterVR);
      sceneEl.addEventListener('exit-vr', this.onExitVR);

      // Click (con la otra mano) → abrir el mapa grande en VR (Fase 2).
      this.onClick = () => window.dispatchEvent(new CustomEvent('vr-minimap-open'));
      this.el.addEventListener('click', this.onClick);
    },

    tick: function (time) {
      if (time - this.lastUpdate < UPDATE_MS) return;
      this.lastUpdate = time;

      const state = useTourStore.getState();
      const scene = state.scenesCache[state.activeSubId];
      const hasPos = Boolean(scene && Array.isArray(scene.posicion) && scene.posicion.length > 0);

      this.group.visible = this.inVR && hasPos;
      if (!this.inVR || !hasPos) return;

      // Cambio de nivel → cambiar la textura del plano. Solo se mantiene una
      // textura activa a la vez: la anterior se libera (dispose) para no
      // acumular VRAM en Quest 3S (a 4096 no caben varias residentes).
      const levelNum = LEVEL_TO_NUM[scene.nivel];
      if (levelNum && levelNum !== this.currentLevel) {
        const nextTex = getPlanTexture(levelNum);
        if (nextTex) {
          const renderer = this.el.sceneEl.renderer;
          if (renderer) {
            nextTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
            nextTex.needsUpdate = true;
          }

          const prevTex = this.tex;
          this.planoMaterial.map = nextTex;
          this.planoMaterial.needsUpdate = true;
          this.tex = nextTex;
          this.currentLevel = levelNum;
          releasePlanTexture(prevTex);
        }
      }

      // Posición del usuario → recorte tipo radar centrado en (posicion).
      const tex = this.planoMaterial.map;
      if (tex) {
        // Repeat por eje para que el recorte sea "cuadrado" en píxeles de imagen
        // pese a la relación de aspecto del plano (evita deformar el radar).
        const aspect = tex.userData?.aspect || 1;
        const rx = Math.min(1, this.data.zoom);
        const ry = Math.min(1, this.data.zoom * aspect);
        tex.repeat.set(rx, ry);

        const clamp = (v, r) => Math.min(1 - r, Math.max(0, v));
        const px = (scene.posicion[0] || 0) / 100;
        const py = (scene.posicion[1] || 0) / 100;
        // El centro del disco (uv v = 0.5) debe mostrar la posición del usuario:
        //   v_muestreada = 0.5·ry + offset.y = (1 - py)  →  fila de imagen = py.
        // Se usa (1 - py) porque CanvasTexture tiene flipY = true (v = 1 mapea a
        // la fila SUPERIOR de la imagen). El eje X mapea directo (px). Esto es
        // coherente con vrMapPlano, que ubica la flecha en espacio de geometría
        // con (0.5 - py)·alto (otro espacio, misma posición resultante).
        tex.offset.set(clamp(px - rx / 2, rx), clamp((1 - py) - ry / 2, ry));
      }

      // Rumbo de la cámara → rotar la flecha. Reutiliza la misma fórmula que el
      // minimapa HTML; por defecto invertimos el signo porque rotate() de CSS es
      // horario y rotation.z de THREE es antihorario (flipArrow lo revierte si en
      // el casco la flecha gira al revés).
      if (this.cameraEl) {
        const deg = computeMinimapDegrees(this.cameraEl, scene.coordinacionAngulo || 0);
        const sign = this.data.flipArrow ? 1 : -1;
        this.arrow.rotation.z = sign * this.THREE.MathUtils.degToRad(deg);
      }
    },

    remove: function () {
      const sceneEl = this.el.sceneEl;
      if (sceneEl) {
        sceneEl.removeEventListener('enter-vr', this.onEnterVR);
        sceneEl.removeEventListener('exit-vr', this.onExitVR);
      }
      this.el.removeEventListener('click', this.onClick);

      // Liberar recursos GPU. El canvas subyacente vive en la caché de
      // planTextures; aquí liberamos la textura activa y los meshes propios.
      releasePlanTexture(this.tex);
      this.tex = null;
      this.el.removeObject3D('minimap');
      this.group.traverse((obj) => {
        if (obj.isMesh) {
          obj.geometry?.dispose();
          obj.material?.dispose();
        }
      });
    }
  });
};

registerVRMinimap();
