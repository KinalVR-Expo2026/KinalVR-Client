import { getPlanTexture, releasePlanTexture } from '../utils/planTextures';
import { computeMinimapDegrees } from './registerVRComponents';
import { buildArrowGeometry } from './arrowGeometry';
import { useTourStore } from '../store/useTourStore';
import { BACKGROUND_CALIBRATION, LEVEL_TO_NUM } from '../constants/campusMap';

// Componente del plano grande del mapa del campus en VR (contraparte 3D del tab
// "Mapa" de CampusMapPage / MapInteractive). Replica el "overlay" de escritorio:
// el nivel 1 SIEMPRE se dibuja de base y, si el nivel activo no es el 1, encima
// se dibuja el plano del nivel activo transformado (BACKGROUND_CALIBRATION) para
// que su edificio caiga alineado sobre la planta baja.
//
// Estructura de object3D (todo dentro de un zoomGroup para T7 zoom/arrastre):
//   host a-plane (geometría W×H, transparente, className="clickable" — es la
//                 superficie de raycast del zoom/arrastre y del hit-test de dots)
//     └─ zoomGroup (THREE.Group)                     ← escala/traslada con zoom
//          ├─ baseMesh  (W×H, textura nivel 1 SIEMPRE)
//          └─ overlayGroup (THREE.Group)             ← transform del nivel activo
//               ├─ overlayMesh (W×H, textura del nivel activo)
//               ├─ user-arrow  (flecha del usuario)
//               └─ dots        (T8, puntos de teletransporte)
//
// El mesh 'mesh' propio del a-plane host se deja TRANSPARENTE (opacity 0 vía el
// material del JSX) — conserva su geometría plana para el raycast pero no pinta.
// Nuestros meshes (base/overlay) viven en el zoomGroup, no en 'mesh'.
//
// Matemática del overlay (derivada del CSS de MapInteractive, ver self-review):
//   El CSS aplica al img del nivel: translate(-x%, -y%) scale(1/cal.scale).
//   En THREE, con el plano centrado en el origen y W/H el tamaño en mundo:
//     S   = 1 / cal.scale
//     Txp = -parseFloat(cal.x)   (misma negación que el CSS)
//     Typ = -parseFloat(cal.y)
//     position.x = (Txp/100)*W;  position.y = -(Typ/100)*H  (Y CSS↓ → THREE↑)
//     scale = (S, S, 1)
//   overlayDx/overlayDy (schema) se SUMAN a position.x/y para calibrar en casco.

const buildArrow = (THREE, size) => {
  const arrow = new THREE.Group();
  const back = new THREE.Mesh(
    buildArrowGeometry(THREE, (size * 1.25) / 100),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  back.position.z = 0.011;
  const front = new THREE.Mesh(
    buildArrowGeometry(THREE, (size * 0.95) / 100),
    new THREE.MeshBasicMaterial({ color: 0x20346b })
  );
  front.position.z = 0.012;
  arrow.add(back, front);
  arrow.visible = false;
  return arrow;
};

export const registerVRMapPlano = () => {
  if (typeof window === 'undefined' || !window.AFRAME) return;
  if (window.AFRAME.components['vr-map-plano']) return;

  const AFRAME = window.AFRAME;
  const THREE = window.THREE || AFRAME.THREE;

  AFRAME.registerComponent('vr-map-plano', {
    schema: {
      level: { type: 'int', default: 1 },
      height: { type: 'number', default: 1.2 },
      // Ajuste fino del overlay en unidades de mundo (calibrable en casco sin
      // recompilar): se suman a la posición calculada del overlayGroup.
      overlayDx: { type: 'number', default: 0 },
      overlayDy: { type: 'number', default: 0 }
    },

    init: function () {
      this.THREE = THREE;
      this.lastAspect = 0;
      this.currentLevel = null;   // nivel de la textura del overlay actual
      this.overlayTex = null;     // textura del overlay (se libera al cambiar de nivel)

      // Rumbo "congelado" al abrir el mapa (una foto, como el userRotation HTML).
      const cameraEl = this.el.sceneEl.querySelector('[camera]');
      const scene = useTourStore.getState().scenesCache[useTourStore.getState().activeSubId];
      this.frozenHeadingDeg = cameraEl
        ? computeMinimapDegrees(cameraEl, scene?.coordinacionAngulo || 0)
        : 0;

      // --- zoomGroup: contenedor de TODO lo que escala/traslada con el zoom ---
      this.zoomGroup = new THREE.Group();

      // baseMesh: plano W×H con la textura del NIVEL 1 siempre. Geometría 1×1
      // (se escala por width/height del a-plane no; aquí usamos PlaneGeometry y
      // fijamos escala W/H al dimensionar en tick).
      this.baseMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, alphaTest: 0.01, side: THREE.DoubleSide
      });
      this.baseMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.baseMaterial);
      this.baseMesh.position.z = 0;
      this.zoomGroup.add(this.baseMesh);

      // overlayGroup: contiene el plano del nivel activo + flecha + dots (T8).
      this.overlayGroup = new THREE.Group();
      this.overlayMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, alphaTest: 0.01, side: THREE.DoubleSide
      });
      this.overlayMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.overlayMaterial);
      this.overlayMesh.position.z = 0.001;
      this.overlayGroup.add(this.overlayMesh);

      // Flecha del usuario (hija del overlayGroup → hereda transform del nivel + zoom).
      this.arrow = buildArrow(THREE, this.data.height * 0.12);
      this.overlayGroup.add(this.arrow);

      this.zoomGroup.add(this.overlayGroup);
      this.el.setObject3D('zoom-group', this.zoomGroup);

      // Textura base (nivel 1): vive SIEMPRE, no se libera al cambiar de nivel.
      this.baseTex = getPlanTexture(1);
      if (this.baseTex) {
        this.applyAnisotropy(this.baseTex);
        this.baseMaterial.map = this.baseTex;
        this.baseMaterial.needsUpdate = true;
      }

      this.applyOverlayTexture();
    },

    applyAnisotropy: function (tex) {
      const renderer = this.el.sceneEl.renderer;
      if (renderer && tex) {
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        tex.needsUpdate = true;
      }
    },

    update: function () {
      this.applyOverlayTexture();
    },

    // Carga (o libera + recarga) la textura del overlay al cambiar de nivel.
    // Patrón dispose-on-switch de T2 (vrMinimap): solo una textura de overlay
    // residente a la vez. La base (nivel 1) NO se toca aquí.
    applyOverlayTexture: function () {
      const level = this.data.level;
      if (level === this.currentLevel) return;

      const prevTex = this.overlayTex;

      if (level === 1) {
        // Nivel 1: no hay overlay; solo se libera la textura anterior.
        this.overlayMaterial.map = null;
        this.overlayMaterial.needsUpdate = true;
        this.overlayTex = null;
      } else {
        const nextTex = getPlanTexture(level);
        if (nextTex) {
          this.applyAnisotropy(nextTex);
          nextTex.repeat.set(1, 1);
          nextTex.offset.set(0, 0);
          this.overlayMaterial.map = nextTex;
          this.overlayMaterial.needsUpdate = true;
          this.overlayTex = nextTex;
        }
      }

      this.currentLevel = level;
      if (prevTex) releasePlanTexture(prevTex);

      this.lastAspect = 0; // forzar re-dimensionado + re-transform del overlay
    },

    // Dimensiona base/overlay a W×H y aplica el transform del overlay del nivel.
    layout: function (width, height) {
      this.width = width;
      this.height = height;

      this.baseMesh.scale.set(width, height, 1);
      this.overlayMesh.scale.set(width, height, 1);

      const level = this.data.level;
      if (level === 1) {
        // Base a color pleno; overlay oculto; overlayGroup en identidad (coincide
        // con la base) para que flecha y dots vivan en el mismo espacio.
        this.baseMaterial.color.setHex(0xffffff);
        this.baseMaterial.opacity = 1;
        this.overlayMesh.visible = false;
        this.overlayGroup.position.set(0, 0, 0.002);
        this.overlayGroup.scale.set(1, 1, 1);
      } else {
        // Base atenuada (como el opacity-40 grayscale del CSS); overlay visible
        // con el plano del nivel; overlayGroup transformado con la matemática.
        this.baseMaterial.color.setHex(0x4d4d4d);
        this.baseMaterial.opacity = 0.4;
        this.overlayMesh.visible = true;

        const cal = BACKGROUND_CALIBRATION[level];
        if (cal) {
          const S = 1 / cal.scale;
          const Txp = -parseFloat(cal.x); // misma negación que el CSS
          const Typ = -parseFloat(cal.y);
          this.overlayGroup.position.set(
            (Txp / 100) * width + this.data.overlayDx,
            -(Typ / 100) * height + this.data.overlayDy, // Y invertida CSS→THREE
            0.002
          );
          this.overlayGroup.scale.set(S, S, 1);
        } else {
          this.overlayGroup.position.set(this.data.overlayDx, this.data.overlayDy, 0.002);
          this.overlayGroup.scale.set(1, 1, 1);
        }
      }
      this.baseMaterial.needsUpdate = true;
    },

    tick: function () {
      const aspect = this.baseTex?.userData?.aspect || this.overlayTex?.userData?.aspect || 1;
      const width = this.data.height * aspect;
      const height = this.data.height;

      if (aspect !== this.lastAspect) {
        this.lastAspect = aspect;
        // La geometría del a-plane host (superficie de raycast) sigue el mismo W×H.
        this.el.setAttribute('width', width);
        this.el.setAttribute('height', height);
        this.layout(width, height);
      }

      // Flecha del usuario: solo si el nivel mostrado es el de la escena actual.
      const state = useTourStore.getState();
      const scene = state.scenesCache[state.activeSubId];
      const hasPos = Boolean(scene && Array.isArray(scene.posicion) && scene.posicion.length > 0);
      const onThisLevel = hasPos && LEVEL_TO_NUM[scene.nivel] === this.data.level;

      this.arrow.visible = onThisLevel;
      if (onThisLevel) {
        const px = (scene.posicion[0] || 0) / 100;
        const py = (scene.posicion[1] || 0) / 100;
        this.arrow.position.set((px - 0.5) * width, (0.5 - py) * height, 0.01);
        this.arrow.rotation.z = -this.THREE.MathUtils.degToRad(this.frozenHeadingDeg);
      }
    },

    remove: function () {
      this.el.removeObject3D('zoom-group');

      // Meshes/geometrías/materiales propios.
      [this.baseMesh, this.overlayMesh].forEach((m) => {
        m?.geometry?.dispose();
        m?.material?.dispose();
      });
      this.arrow.traverse((obj) => {
        if (obj.isMesh) {
          obj.geometry?.dispose();
          obj.material?.dispose();
        }
      });

      // Texturas: la base (nivel 1) y la del overlay activo.
      releasePlanTexture(this.baseTex);
      releasePlanTexture(this.overlayTex);
      this.baseTex = null;
      this.overlayTex = null;
    }
  });
};

registerVRMapPlano();
