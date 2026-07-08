import { useEffect, useRef, useState } from 'react';
import { registerVRMapPlano } from '../aframe/vrMapPlano';
import { useTourStore } from '../store/useTourStore';
import { LEVEL_TO_NUM, LEVEL_PLAN_ASPECT_CSS } from '../constants/campusMap';
import { VRLevelSelector } from './VRLevelSelector';

// Mapa grande del campus dentro de VR (contraparte 3D del tab "Mapa" de
// CampusMapPage). Se abre al clickear el minimapa de muñeca y muestra el plano
// completo del nivel, botones para cambiar de piso y la flecha del usuario.
// Solo cubre el tab Mapa en v1; Admin/Eventos siguen en escritorio.
//
// Estructura: root (posición en el mundo + `billboard`, que solo escribe
// rotation.y) > tiltGroup (rotation.x fijo, inclinación tipo mesa de dibujo,
// sobrevive porque billboard no toca X) > contenido visual del panel
// (atenuación, plano del mapa, selector de niveles). Sin marco/tarjeta ni
// título: el plano del mapa es el protagonista, con una atenuación suave
// detrás para que no se pierda contra el fondo 360.
//
// Cierre: NO usa VRBackdrop (ese patrón de plano gigante detrás del panel
// causaba el bug crítico — la mano que no apunta al panel casi siempre
// apunta al backdrop, y su gatillo cerraba el mapa). En su lugar, un
// listener de bajo nivel en las manos (triggerdown/pinchstarted) decide
// cerrar solo si el rayo NO está tocando nada dentro del panel — ver el
// efecto de cierre-por-fuera más abajo.
//
// El panel se coloca cerca y a la altura de los ojos del usuario para que se
// sienta como sostener un mapa en las manos.
//
// Todas las medidas/posiciones son ajustables — requieren calibración en casco.

registerVRMapPlano();

const PANEL_HEIGHT = 1.2;

// Misma proporción que los 4 planos (invariante documentado en campusMap.js).
const [ASPECT_W, ASPECT_H] = LEVEL_PLAN_ASPECT_CSS.split('/').map(Number);
const MAP_ASPECT = ASPECT_W / ASPECT_H;
export const MAP_WIDTH = PANEL_HEIGHT * MAP_ASPECT;

// Distancia del panel frente a la cámara al abrir — calibrable 0.9-1.15.
const PANEL_DISTANCE = 1.0;

// Inclinación del tiltGroup — calibrable -28…-38; negativo = borde superior
// alejándose, tipo mesa de dibujo.
const PANEL_TILT_DEG = -32;

const BG_MARGIN = 0.15;
const BG_WIDTH = MAP_WIDTH + BG_MARGIN;
const BG_HEIGHT = PANEL_HEIGHT + BG_MARGIN;
const BG_CENTER_Y = 0.15;
const BG_TOP = BG_CENTER_Y + BG_HEIGHT / 2;

const BUTTON_X = MAP_WIDTH / 2 + 0.3;
const BUTTON_STEP = 0.3;

// Ventana de gracia (ms) del cierre-por-fuera: el refresh escalonado de
// raycasters (ver SceneViewer) tarda un poco en poner los botones/plano recién
// montados en la whitelist del raycaster. Si el usuario gatilla al vacío antes
// de que el refresh corra, la whitelist puede estar vacía y un rayo que en
// realidad SÍ apunta al panel se leería como "afuera" → cierre falso al abrir.
const CLOSE_GRACE_MS = 700;

export const VRCampusMap = ({ cameraRef, onClose, onTeleport }) => {
  const rootRef = useRef(null);
  const tiltGroupRef = useRef(null);
  const planoRef = useRef(null);

  const [activeLevel, setActiveLevel] = useState(() => {
    const state = useTourStore.getState();
    const scene = state.scenesCache[state.activeSubId];
    return (scene?.nivel && LEVEL_TO_NUM[scene.nivel]) || 3;
  });

  // Colocar el panel frente al usuario (foto de la cámara al abrir), mirando
  // hacia él y sin heredar el cabeceo (solo yaw). `billboard` toma el relevo
  // después para seguir rotando hacia la cámara sin reposicionarse.
  useEffect(() => {
    const root = rootRef.current;
    const cam = cameraRef?.current;
    if (!root || !cam || !cam.object3D) return;

    const THREE = window.THREE || window.AFRAME.THREE;
    const camObj = cam.object3D;

    const quat = new THREE.Quaternion();
    camObj.getWorldQuaternion(quat);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
    const pos = new THREE.Vector3();
    camObj.getWorldPosition(pos);

    // Capturar la Y de la cámara ANTES de mutar `pos` con el forward.
    const camY = pos.y;

    root.object3D.position.copy(pos.add(forward.multiplyScalar(PANEL_DISTANCE)));

    // Altura a nivel de ojos: usar la Y real de la cámara (local-floor la da
    // correcta) con un fallback razonable si el casco no reporta nada útil.
    const EYE_FALLBACK = 1.65; // si el casco no da altura útil
    const HEIGHT_OFFSET = -0.1; // centro del mapa un pelo bajo la vista (calibrable)
    const eyeY = Number.isFinite(camY) && camY > 0.5 ? camY : EYE_FALLBACK;
    root.object3D.position.y = Math.min(2.2, Math.max(1.0, eyeY + HEIGHT_OFFSET));

    const euler = new THREE.Euler().setFromQuaternion(quat, 'YXZ');
    root.object3D.rotation.set(0, euler.y, 0);
  }, [cameraRef]);

  // Teletransporte: vr-map-plano emite `map-teleport` en el a-plane host cuando
  // el usuario toca un dot (hit-test THREE, ver mapTeleportDots). Patrón del
  // proyecto: ref + addEventListener (ConnectionMarker).
  useEffect(() => {
    const el = planoRef.current;
    if (!el) return;
    const handle = (e) => {
      const subId = e.detail?.subId;
      if (subId) onTeleport?.(subId);
    };
    el.addEventListener('map-teleport', handle);
    return () => el.removeEventListener('map-teleport', handle);
  }, [onTeleport]);

  // Cierre por toque afuera. Reemplaza el patrón VRBackdrop (plano gigante que
  // "gana" cualquier gatillo de la mano que no apunta al panel) por un chequeo
  // directo sobre lo que cada mano está apuntando: solo cierra si el objeto
  // clickeable más cercano NO pertenece al panel (rootRef). Escucha a nivel de
  // mano (triggerdown para mandos, pinchstarted para hand-tracking — las dos
  // viven en las mismas entidades [laser-controls]/[hand-tracking-controls]).
  useEffect(() => {
    const openedAt = performance.now();
    const hands = document.querySelectorAll('[laser-controls], [hand-tracking-controls]');
    const uniqueHands = [...new Set(hands)];

    const isInsidePanel = (el) => {
      const root = rootRef.current;
      return Boolean(root && el && (el === root || root.contains(el)));
    };

    const onTrigger = (evt) => {
      const handEl = evt.currentTarget;
      const ray = handEl.components?.raycaster;
      if (!ray) return;
      const els = ray.intersectedEls || [];

      if (els.length === 0) {
        // Rayo al vacío: cerrar solo pasada la ventana de gracia (si el
        // refresh de raycasters aún no corrió, la whitelist puede estar
        // vacía y esto sería un falso "afuera").
        if (performance.now() - openedAt > CLOSE_GRACE_MS) onClose?.();
        return;
      }

      const target = els[0];
      // El minimapa de muñeca (solo la mano derecha lo apunta) ya tiene su
      // propio toggle (vr-minimap-open) en SceneViewer. Si dejáramos que este
      // efecto también cierre, el mismo gatillo dispararía cierre + toggle →
      // neto reabrir. Se ignora explícitamente y se deja que el toggle actúe.
      if (target.classList?.contains('vrmap-target')) return;

      if (!isInsidePanel(target)) onClose?.();
    };

    uniqueHands.forEach((h) => {
      h.addEventListener('triggerdown', onTrigger);
      h.addEventListener('pinchstarted', onTrigger);
    });
    return () => uniqueHands.forEach((h) => {
      h.removeEventListener('triggerdown', onTrigger);
      h.removeEventListener('pinchstarted', onTrigger);
    });
  }, [onClose]);

  return (
    <a-entity ref={rootRef} billboard>
      {/* tiltGroup: inclina todo el panel visual como una mesa de dibujo
          técnico. `billboard` (en el root) solo escribe rotation.y, así que
          esta rotation.x sobrevive intacta. Una tarea posterior añade un
          zoomGroup dentro de este grupo. */}
      <a-entity ref={tiltGroupRef} rotation={`${PANEL_TILT_DEG} 0 0`}>
        {/* Atenuación suave detrás del plano — sin marco ni esquineros, solo
            para que el mapa no se pierda contra el fondo 360 */}
        <a-plane
          width={BG_WIDTH}
          height={BG_HEIGHT}
          position={`0 ${BG_CENTER_Y} -0.03`}
          material="shader: flat; color: #0c0f1e; opacity: 0.55; transparent: true; side: double"
        ></a-plane>

        {/* Plano del nivel. vr-map-plano dibuja base+overlay+flecha (+dots) en un
            zoomGroup interno; el a-plane host queda TRANSPARENTE (opacity 0) pero
            conserva su geometría W×H y className="clickable" para ser la superficie
            de raycast del zoom, arrastre y hit-test de los dots de teletransporte. */}
        <a-plane
          ref={planoRef}
          className="clickable"
          vr-map-plano={`level: ${activeLevel}; height: ${PANEL_HEIGHT}`}
          position={`0 ${BG_CENTER_Y} 0`}
          material="shader: flat; color: #ffffff; opacity: 0; transparent: true; side: double"
        ></a-plane>

        <VRLevelSelector
          activeLevel={activeLevel}
          onSelectLevel={setActiveLevel}
          onClose={onClose}
          buttonX={BUTTON_X}
          centerY={BG_CENTER_Y}
          step={BUTTON_STEP}
          topY={BG_TOP}
        />
      </a-entity>
    </a-entity>
  );
};
