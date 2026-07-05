import { useEffect, useRef, useState } from 'react';
import { registerVRMapPlano } from '../aframe/vrMapPlano';
import { useTourStore } from '../store/useTourStore';
import { LEVEL_TO_NUM, LEVEL_PLAN_ASPECT_CSS } from '../constants/campusMap';
import { VRBackdrop } from './VRBackdrop';
import { VRLevelSelector } from './VRLevelSelector';

// Mapa grande del campus dentro de VR (contraparte 3D del tab "Mapa" de
// CampusMapPage). Se abre al clickear el minimapa de muñeca y muestra el plano
// completo del nivel, botones para cambiar de piso y la flecha del usuario.
// Solo cubre el tab Mapa en v1; Admin/Eventos siguen en escritorio.
//
// Estructura: root (posición en el mundo + `billboard`, que solo escribe
// rotation.y) > tiltGroup (rotation.x fijo, inclinación tipo mesa de dibujo,
// sobrevive porque billboard no toca X) > contenido visual del panel
// (atenuación, plano del mapa, catcher, selector de niveles). `VRBackdrop`
// cuelga directo del root — es la cortina de cierre, no parte del panel — y
// se cierra al tocar cualquier punto fuera de él, mismo patrón que
// VREventDetailPanel. Sin marco/tarjeta ni título: el plano del mapa es el
// protagonista, con una atenuación suave detrás para que no se pierda contra
// el fondo 360. Una tarea posterior añade un zoomGroup dentro del tiltGroup.
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

// Caja invisible que cubre TODO el panel (mapa + columna de botones + título).
// Es clickable y "traga" los rayos que caen dentro del panel para que no lleguen
// al backdrop de cierre que está detrás. Sin ella, como el mapa es transparente y
// no clickable, el rayo lo atravesaba y golpeaba el backdrop → cerraba al tocar el
// mapa. Con ella, SOLO los toques fuera del panel cierran. Va delante del backdrop
// (z mayor) y detrás del mapa/botones (z menor) para no robarles el clic.
const CATCHER_X_MIN = -BG_WIDTH / 2;
const CATCHER_X_MAX = BUTTON_X + 0.19;
const CATCHER_Y_MIN = BG_CENTER_Y - BG_HEIGHT / 2 - 0.05;
const CATCHER_Y_MAX = BG_TOP + 0.28;
const CATCHER_CX = (CATCHER_X_MIN + CATCHER_X_MAX) / 2;
const CATCHER_CY = (CATCHER_Y_MIN + CATCHER_Y_MAX) / 2;
const CATCHER_W = CATCHER_X_MAX - CATCHER_X_MIN;
const CATCHER_H = CATCHER_Y_MAX - CATCHER_Y_MIN;

export const VRCampusMap = ({ cameraRef, onClose }) => {
  const rootRef = useRef(null);
  const tiltGroupRef = useRef(null);

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

  return (
    <a-entity ref={rootRef} billboard>
      <VRBackdrop onClose={onClose} />

      {/* tiltGroup: inclina todo el panel visual como una mesa de dibujo
          técnico. `billboard` (en el root) solo escribe rotation.y, así que
          esta rotation.x sobrevive intacta. Una tarea posterior añade un
          zoomGroup dentro de este grupo. */}
      <a-entity ref={tiltGroupRef} rotation={`${PANEL_TILT_DEG} 0 0`}>
        {/* Atrapa-rayos del panel: clickable, invisible, sin handler. Solo existe
            para que los toques DENTRO del panel no lleguen al backdrop de cierre. */}
        <a-plane
          className="clickable"
          width={CATCHER_W}
          height={CATCHER_H}
          position={`${CATCHER_CX} ${CATCHER_CY} -0.015`}
          material="shader: flat; opacity: 0; transparent: true; side: double"
        ></a-plane>

        {/* Atenuación suave detrás del plano — sin marco ni esquineros, solo
            para que el mapa no se pierda contra el fondo 360 */}
        <a-plane
          width={BG_WIDTH}
          height={BG_HEIGHT}
          position={`0 ${BG_CENTER_Y} -0.03`}
          material="shader: flat; color: #0c0f1e; opacity: 0.55; transparent: true; side: double"
        ></a-plane>

        {/* Plano del nivel (textura + flecha del usuario las maneja vr-map-plano) */}
        <a-plane
          vr-map-plano={`level: ${activeLevel}; height: ${PANEL_HEIGHT}`}
          position={`0 ${BG_CENTER_Y} 0`}
          material="shader: flat; color: #ffffff; side: double"
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
