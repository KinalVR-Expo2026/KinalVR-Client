import { getPlanTexture, releasePlanTexture } from '../utils/planTextures';
import { computeMinimapDegrees } from './registerVRComponents';
import { buildArrowGeometry } from './arrowGeometry';
import { useTourStore } from '../store/useTourStore';
import { BACKGROUND_CALIBRATION, LEVEL_TO_NUM } from '../constants/campusMap';
import { buildDots, hitTestDot, disposeDots } from './mapTeleportDots';

// --- T7: zoom doble-tap + arrastre con grip (constantes calibrables) ---
const ZOOM_SCALE = 2.5;        // factor de zoom-in
const DOUBLE_TAP_MS = 400;     // ventana temporal para el doble-tap
const DOUBLE_TAP_UV_DIST = 0.08; // distancia UV máx. entre los dos taps
const DEDUPE_MS = 50;          // ignora clicks duplicados del mismo gesto (hand-pinch)

// --- T8: puntos de teletransporte ---
const DOTS_REBUILD_MS = 1000;  // refresco del filtro/dibujo de dots (~1 Hz, barato)
const DOT_HIT_RADIUS = 0.035;  // radio de acierto del click sobre un dot (mundo)

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
//          ├─ overlayGroup (THREE.Group)             ← transform del nivel activo
//          │    └─ overlayMesh (W×H, textura del nivel activo)
//          ├─ user-arrow  (flecha del usuario, HERMANA de overlayGroup: igual que
//          │               en escritorio, su posición vive en "espacio base" y
//          │               solo hereda el zoom/arrastre del zoomGroup, no el
//          │               transform propio del overlay del nivel activo)
//          └─ dots        (T8, puntos de teletransporte, mismo espacio base)
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

      // overlayGroup: contiene SOLO el plano del nivel activo (transformado por
      // BACKGROUND_CALIBRATION). Flecha y dots (T8) NO van aquí — ver más abajo.
      this.overlayGroup = new THREE.Group();
      this.overlayMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, alphaTest: 0.01, side: THREE.DoubleSide
      });
      this.overlayMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.overlayMaterial);
      this.overlayMesh.position.z = 0.001;
      this.overlayGroup.add(this.overlayMesh);

      this.zoomGroup.add(this.overlayGroup);

      // Flecha del usuario: HERMANA de overlayGroup (hija directa del zoomGroup),
      // no hija del overlay — su posición ya está en espacio base (ver tick()),
      // así que solo debe heredar el zoom/arrastre, no el transform del overlay.
      this.arrow = buildArrow(THREE, this.data.height * 0.12);
      this.arrow.position.z = 0.003; // por encima del base (z=0) y del overlay (z=0.002)
      this.zoomGroup.add(this.arrow);
      this.el.setObject3D('zoom-group', this.zoomGroup);

      // Textura base (nivel 1): vive SIEMPRE, no se libera al cambiar de nivel.
      this.baseTex = getPlanTexture(1);
      if (this.baseTex) {
        this.applyAnisotropy(this.baseTex);
        this.baseMaterial.map = this.baseTex;
        this.baseMaterial.needsUpdate = true;
      }

      this.applyOverlayTexture();

      // --- T7: estado de zoom/arrastre ---
      this.isZoomed = false;
      this.lastClick = null;      // { t, u, v } del último click válido (para doble-tap)
      this.lastClickAt = 0;       // timestamp del último click (dedupe)
      this.dragHand = null;       // entidad de mano que sostiene el grip (o null)
      this.dragPrevPoint = null;  // punto local (padre del zoomGroup) del frame anterior
      this._tmpV3 = new THREE.Vector3();

      // Listener de click del host: resuelve teleport (T8), doble-tap (zoom) o
      // simple tap (arma el doble-tap). Ver onHostClick.
      this.onHostClick = this.onHostClick.bind(this);
      this.el.addEventListener('click', this.onHostClick);

      // Grip de las manos para el arrastre (solo con zoom). Ningún otro componente
      // usa grip en el proyecto, así que el gesto queda libre. Se enlazan lazy a
      // las entidades [laser-controls]; si aún no existen, reintenta en el tick.
      this.onGripDown = this.onGripDown.bind(this);
      this.onGripUp = this.onGripUp.bind(this);
      this.gripHands = [];
      this.bindGripHands();

      // --- T8: dots de teletransporte ---
      this.dotsGroupRef = { current: null }; // grupo THREE de dots (hijo del zoomGroup)
      this.dots = [];                        // descriptores { subId, x, y } para hit-test
      this.dotsLevel = null;                 // nivel del último rebuild
      this.lastDotsBuild = 0;
      // Pre-cargar el índice global de escenas (cacheado en el store).
      useTourStore.getState().fetchScenesIndex();
    },

    // Enlaza gripdown/gripup a las dos manos. Idempotente: solo enlaza las manos
    // que aún no estén en gripHands (por si al init todavía no existían).
    bindGripHands: function () {
      const hands = document.querySelectorAll('[laser-controls]');
      hands.forEach((hand) => {
        if (this.gripHands.includes(hand)) return;
        hand.addEventListener('gripdown', this.onGripDown);
        hand.addEventListener('gripup', this.onGripUp);
        this.gripHands.push(hand);
      });
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

      // Cambiar de nivel con zoom activo → resetear el encuadre (evita confusión).
      if (this.isZoomed) this.zoomOut();

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
        // Base a color pleno; overlay oculto. overlayGroup en identidad (no afecta
        // a flecha/dots: ahora viven en el zoomGroup, en espacio base, no dentro
        // del overlay).
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

    // --- T7: zoom ---

    // Clampa una posición de paneo del zoomGroup para que el plano no se salga
    // del encuadre. maxX/Y = (S-1)*dim/2 con el tamaño del plano W×H.
    clampPan: function (pos) {
      const S = this.zoomGroup.scale.x;
      const maxX = ((S - 1) * this.width) / 2;
      const maxY = ((S - 1) * this.height) / 2;
      pos.x = Math.min(maxX, Math.max(-maxX, pos.x));
      pos.y = Math.min(maxY, Math.max(-maxY, pos.y));
    },

    // Zoom-in centrado en el punto tocado (coords locales del PADRE del zoomGroup)
    // para que ese punto quede fijo bajo el dedo. Aplica clamp de paneo.
    zoomInAt: function (worldPoint) {
      const parent = this.zoomGroup.parent;
      if (!parent) return;
      const p = parent.worldToLocal(worldPoint.clone());
      const S = ZOOM_SCALE;
      this.zoomGroup.scale.set(S, S, 1);
      this.zoomGroup.position.set(p.x * (1 - S), p.y * (1 - S), 0);
      this.clampPan(this.zoomGroup.position);
      this.isZoomed = true;
    },

    zoomOut: function () {
      this.zoomGroup.scale.set(1, 1, 1);
      this.zoomGroup.position.set(0, 0, 0);
      this.isZoomed = false;
    },

    onHostClick: function (evt) {
      const now = performance.now();
      // Dedupe: hand-pinch-click emite click+mousedown casi juntos para el mismo
      // gesto → ignorar cualquier click a < DEDUPE_MS del anterior.
      if (now - this.lastClickAt < DEDUPE_MS) return;
      this.lastClickAt = now;

      const intersection = evt.detail?.intersection;
      const point = intersection?.point;

      // T8: ¿cayó sobre un dot de teletransporte? (hit-test en espacio overlay).
      // Se rellena en T8; por ahora hitTestTeleport devuelve null.
      if (point) {
        const subId = this.hitTestTeleport(point);
        if (subId) {
          this.el.emit('map-teleport', { subId });
          return; // no cuenta para el doble-tap
        }
      }

      // Coordenadas UV para medir la distancia entre taps (fallback a point.xy).
      const uv = intersection?.uv;
      const u = uv ? uv.x : (point ? point.x : 0);
      const v = uv ? uv.y : (point ? point.y : 0);

      const last = this.lastClick;
      const isDouble = last &&
        (now - last.t) < DOUBLE_TAP_MS &&
        Math.hypot(u - last.u, v - last.v) < DOUBLE_TAP_UV_DIST;

      if (isDouble) {
        if (this.isZoomed) {
          this.zoomOut();
        } else if (point) {
          this.zoomInAt(point);
        }
        this.lastClick = null; // consumido: no encadenar triple-tap
      } else {
        this.lastClick = { t: now, u, v };
      }
    },

    // --- T8: dots de teletransporte ---

    // Reconstruye los dots del nivel activo leyendo scenesIndex del store.
    // Throttleado en el tick (~1 Hz). Los dots viven en el zoomGroup (espacio
    // base, HERMANOS de overlayGroup), así que heredan solo el zoom automáticamente,
    // no el transform propio del overlay del nivel activo.
    rebuildDots: function () {
      if (!this.width || !this.height) return; // aún sin dimensionar
      const state = useTourStore.getState();
      const scenes = state.scenesIndex;
      if (!Array.isArray(scenes)) return; // índice aún no cargado
      const activeSubId = state.activeSubId;

      this.dots = buildDots(
        this.THREE, this.zoomGroup, this.dotsGroupRef,
        scenes, this.data.level, activeSubId,
        this.width, this.height
      );
      this.dotsLevel = this.data.level;
    },

    // Hit-test de teletransporte: pasa el punto tocado (mundo) al espacio local
    // del zoomGroup (mismo espacio donde ahora viven los dots) y busca un dot
    // dentro de DOT_HIT_RADIUS. Devuelve subId o null.
    hitTestTeleport: function (worldPoint) {
      if (!this.dots || this.dots.length === 0) return null;
      const local = this.zoomGroup.worldToLocal(worldPoint.clone());
      return hitTestDot(local, this.dots, DOT_HIT_RADIUS);
    },

    // --- T7: arrastre con grip ---

    onGripDown: function (evt) {
      if (!this.isZoomed) return; // el arrastre solo tiene sentido con zoom
      this.dragHand = evt.target;
      this.dragPrevPoint = null; // se ancla en el primer frame que intersecte
    },

    onGripUp: function (evt) {
      if (this.dragHand === evt.target) {
        this.dragHand = null;
        this.dragPrevPoint = null;
      }
    },

    // Devuelve el punto de intersección (mundo) del rayo de la mano con el mesh
    // del host, o null si no intersecta. Usa el raycaster de A-Frame de la mano.
    getHandIntersectionPoint: function (hand) {
      const rc = hand?.components?.raycaster;
      if (!rc) return null;
      const inter = rc.getIntersection ? rc.getIntersection(this.el) : null;
      return inter?.point || null;
    },

    // Se llama en el tick cuando hay una mano arrastrando: traslada el zoomGroup
    // por el DELTA del punto tocado entre frames (en el espacio del padre) y
    // aplica el clamp. Si el rayo deja de intersectar, congela (espera a que
    // vuelva y re-ancla) — no salta.
    updateDrag: function () {
      const point = this.getHandIntersectionPoint(this.dragHand);
      if (!point) {
        // Fuera del plano a mitad del gesto: congelar y re-anclar al volver.
        this.dragPrevPoint = null;
        return;
      }
      const parent = this.zoomGroup.parent;
      if (!parent) return;
      const local = parent.worldToLocal(point.clone());

      if (this.dragPrevPoint) {
        this.zoomGroup.position.x += local.x - this.dragPrevPoint.x;
        this.zoomGroup.position.y += local.y - this.dragPrevPoint.y;
        this.clampPan(this.zoomGroup.position);
      }
      this.dragPrevPoint = local;
    },

    tick: function (time) {
      const aspect = this.baseTex?.userData?.aspect || this.overlayTex?.userData?.aspect || 1;
      const width = this.data.height * aspect;
      const height = this.data.height;

      let relayout = false;
      if (aspect !== this.lastAspect) {
        this.lastAspect = aspect;
        // La geometría del a-plane host (superficie de raycast) sigue el mismo W×H.
        this.el.setAttribute('width', width);
        this.el.setAttribute('height', height);
        this.layout(width, height);
        relayout = true;
      }

      // Grip aún sin enlazar (manos que aparecieron tras el init) → reintentar.
      if (this.gripHands.length < 2) this.bindGripHands();

      // Arrastre con grip (solo con zoom).
      if (this.dragHand && this.isZoomed) this.updateDrag();

      // Dots de teletransporte: rebuild al cambiar de nivel/dimensión o ~1 Hz
      // (por si el índice de escenas termina de cargar tras el init).
      if (relayout || this.dotsLevel !== this.data.level ||
          (time - this.lastDotsBuild) > DOTS_REBUILD_MS) {
        this.lastDotsBuild = time;
        this.rebuildDots();
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
        this.arrow.position.set((px - 0.5) * width, (0.5 - py) * height, 0.003);
        this.arrow.rotation.z = -this.THREE.MathUtils.degToRad(this.frozenHeadingDeg);
      }
    },

    remove: function () {
      // Listeners de interacción (T7).
      this.el.removeEventListener('click', this.onHostClick);
      this.gripHands.forEach((hand) => {
        hand.removeEventListener('gripdown', this.onGripDown);
        hand.removeEventListener('gripup', this.onGripUp);
      });
      this.gripHands = [];

      // Dots de teletransporte (T8).
      disposeDots(this.dotsGroupRef);

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
