import { useEffect, useRef, useState } from 'react';
import { registerVRMapPlano } from '../aframe/vrMapPlano';
import { useTourStore } from '../store/useTourStore';
import { LEVEL_TO_NUM, LEVEL_PLAN_ASPECT_CSS } from '../constants/campusMap';
import { VRBackdrop } from './VRBackdrop';

// Mapa grande del campus dentro de VR (contraparte 3D del tab "Mapa" de
// CampusMapPage). Se abre al clickear el minimapa de muñeca y muestra el plano
// completo del nivel, botones para cambiar de piso y la flecha del usuario.
// Solo cubre el tab Mapa en v1; Admin/Eventos siguen en escritorio.
//
// `billboard` mantiene el panel siempre rotado hacia el usuario (estático en
// posición, solo gira) y `VRBackdrop` lo cierra al tocar cualquier punto fuera
// de él — mismo patrón que VREventDetailPanel. Sin marco/tarjeta: el plano del
// mapa es el protagonista, con una atenuación suave detrás para que no se
// pierda contra el fondo 360.
//
// Todas las medidas/posiciones son ajustables — requieren calibración en casco.

registerVRMapPlano();

const PANEL_HEIGHT = 1.2;

// Misma proporción que los 4 planos (invariante documentado en campusMap.js).
const [ASPECT_W, ASPECT_H] = LEVEL_PLAN_ASPECT_CSS.split('/').map(Number);
const MAP_ASPECT = ASPECT_W / ASPECT_H;
const MAP_WIDTH = PANEL_HEIGHT * MAP_ASPECT;

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

// Botón 3D clickeable (láser/pellizco), con el patrón ref + addEventListener que
// usa el resto del tour (ver ConnectionMarker). Bloques sólidos en blanco; el
// activo se resalta en naranja — mismos colores que el selector de escritorio
// (MapInteractive.jsx: bg-orange-500 activo / bg-slate-100 inactivo).
const VRButton = ({ label, active, onSelect, position, width = 0.26, height = 0.22 }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handle = (e) => {
      e.stopPropagation?.();
      onSelect();
    };
    el.addEventListener('click', handle);
    el.addEventListener('mousedown', handle);
    el.addEventListener('touchstart', handle);
    return () => {
      el.removeEventListener('click', handle);
      el.removeEventListener('mousedown', handle);
      el.removeEventListener('touchstart', handle);
    };
  }, [onSelect]);

  return (
    <a-entity
      ref={ref}
      className="clickable"
      position={position}
      geometry={`primitive: plane; width: ${width}; height: ${height}`}
      material={`shader: flat; color: ${active ? '#ea580c' : '#e2e8f0'}; opacity: 1; side: double`}
    >
      <a-text
        value={label}
        align="center"
        position="0 0 0.01"
        color={active ? '#ffffff' : '#1e293b'}
        scale="0.5 0.5 0.5"
      ></a-text>
    </a-entity>
  );
};

export const VRCampusMap = ({ cameraRef, onClose }) => {
  const rootRef = useRef(null);

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

    root.object3D.position.copy(pos.add(forward.multiplyScalar(1.6)));
    const euler = new THREE.Euler().setFromQuaternion(quat, 'YXZ');
    root.object3D.rotation.set(0, euler.y, 0);
  }, [cameraRef]);

  return (
    <a-entity ref={rootRef} billboard>
      <VRBackdrop onClose={onClose} />

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

      <a-text
        value="MAPA DEL CAMPUS"
        align="center"
        position={`0 ${BG_TOP + 0.12} 0`}
        color="#e0e4eb"
        scale="0.6 0.6 0.6"
      ></a-text>

      {/* Plano del nivel (textura + flecha del usuario las maneja vr-map-plano) */}
      <a-plane
        vr-map-plano={`level: ${activeLevel}; height: ${PANEL_HEIGHT}`}
        position={`0 ${BG_CENTER_Y} 0`}
        material="shader: flat; color: #ffffff; side: double"
      ></a-plane>

      {/* Selector de niveles: columna a la derecha del mapa, afuera de su área,
          orden ascendente de abajo hacia arriba (1 abajo … 4 arriba) — mismo
          orden que el selector de escritorio, solo vertical junto al mapa en
          vez de aparte. */}
      {[1, 2, 3, 4].map((level, i) => (
        <VRButton
          key={level}
          label={String(level)}
          active={activeLevel === level}
          onSelect={() => setActiveLevel(level)}
          position={`${BUTTON_X} ${BG_CENTER_Y - 0.45 + i * BUTTON_STEP} 0.02`}
        />
      ))}

      {/* Cerrar */}
      <VRButton
        label="X"
        active={false}
        onSelect={onClose}
        position={`${MAP_WIDTH / 2 - 0.05} ${BG_TOP - 0.05} 0.02`}
        width={0.2}
        height={0.2}
      />
    </a-entity>
  );
};
