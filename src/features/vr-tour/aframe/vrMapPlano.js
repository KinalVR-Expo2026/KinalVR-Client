import { getPlanTexture } from '../utils/planTextures';
import { computeMinimapDegrees } from './registerVRComponents';
import { buildArrowGeometry } from './arrowGeometry';
import { useTourStore } from '../store/useTourStore';
import { LEVEL_TO_NUM } from '../constants/campusMap';

// Componente del plano grande del mapa del campus en VR (contraparte 3D del tab
// "Mapa" de CampusMapPage / MapInteractive). Se aplica a un <a-plane> y:
//  - le pone la textura del plano del nivel `level` (mapa COMPLETO, sin recorte),
//  - dimensiona el plano según la relación de aspecto real del SVG,
//  - dibuja la flecha del usuario en su `posicion` cuando el nivel mostrado es el
//    de la escena actual, con el rumbo "congelado" al abrir (igual que el
//    userRotation del mapa HTML).
//
// Como el <a-plane> conserva su object3D sin escalar (dimensionamos por geometría
// width/height), la flecha se agrega como object3D hermano en coordenadas locales
// del plano sin deformarse.

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
      height: { type: 'number', default: 1.2 }
    },

    init: function () {
      this.THREE = THREE;
      this.texByLevel = {};
      this.lastAspect = 0;

      // Rumbo "congelado" al abrir el mapa (una foto, como el userRotation HTML).
      const cameraEl = this.el.sceneEl.querySelector('[camera]');
      const scene = useTourStore.getState().scenesCache[useTourStore.getState().activeSubId];
      this.frozenHeadingDeg = cameraEl
        ? computeMinimapDegrees(cameraEl, scene?.coordinacionAngulo || 0)
        : 0;

      // Flecha del usuario (oculta hasta que el nivel mostrado sea el suyo).
      this.arrow = buildArrow(THREE, this.data.height * 0.12);
      this.el.setObject3D('user-arrow', this.arrow);

      this.applyTexture();
    },

    update: function () {
      this.applyTexture();
    },

    applyTexture: function () {
      const mesh = this.el.getObject3D('mesh');
      if (!mesh) {
        this.el.addEventListener('loaded', () => this.applyTexture(), { once: true });
        return;
      }
      let tex = this.texByLevel[this.data.level];
      if (!tex) {
        tex = getPlanTexture(this.data.level);
        this.texByLevel[this.data.level] = tex;
      }
      if (!tex) return;

      tex.repeat.set(1, 1);
      tex.offset.set(0, 0);
      mesh.material.map = tex;
      // El plano webp trae alfa: mostrarlo transparente (el panel atenuado detrás
      // hace de fondo). alphaTest recorta el borde para que no quede un halo.
      mesh.material.transparent = true;
      mesh.material.alphaTest = 0.01;
      mesh.material.needsUpdate = true;
      this.tex = tex;
      this.lastAspect = 0; // forzar re-dimensionado con el nuevo aspecto
    },

    tick: function () {
      if (!this.tex) return;

      const aspect = this.tex.userData?.aspect || 1;
      const width = this.data.height * aspect;

      if (aspect !== this.lastAspect) {
        this.lastAspect = aspect;
        this.el.setAttribute('width', width);
        this.el.setAttribute('height', this.data.height);
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
        this.arrow.position.set((px - 0.5) * width, (0.5 - py) * this.data.height, 0.01);
        this.arrow.rotation.z = -this.THREE.MathUtils.degToRad(this.frozenHeadingDeg);
      }
    },

    remove: function () {
      this.el.removeObject3D('user-arrow');
      this.arrow.traverse((obj) => {
        if (obj.isMesh) {
          obj.geometry?.dispose();
          obj.material?.dispose();
        }
      });
      Object.values(this.texByLevel).forEach((t) => t?.dispose());
    }
  });
};

registerVRMapPlano();
