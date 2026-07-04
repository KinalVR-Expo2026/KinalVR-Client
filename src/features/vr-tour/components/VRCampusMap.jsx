import { useEffect, useRef, useState } from 'react';
import { registerVRMapPlano } from '../aframe/vrMapPlano';
import { useTourStore } from '../store/useTourStore';
import { LEVEL_TO_NUM } from '../constants/campusMap';

// Mapa grande del campus dentro de VR (contraparte 3D del tab "Mapa" de
// CampusMapPage). Se abre al clickear el minimapa de muñeca y muestra el plano
// completo del nivel, botones para cambiar de piso y la flecha del usuario.
// Solo cubre el tab Mapa en v1; Admin/Eventos siguen en escritorio.
//
// Todas las medidas/posiciones son ajustables — requieren calibración en casco.

registerVRMapPlano();

const PANEL_HEIGHT = 1.2;

// Botón 3D clickeable (láser/pellizco), con el patrón ref + addEventListener que
// usa el resto del tour (ver ConnectionMarker).
const VRButton = ({ label, active, onSelect, position, width = 0.24, height = 0.2 }) => {
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
      material={`shader: flat; color: ${active ? '#ea580c' : '#1e293b'}; opacity: 0.95; transparent: true; side: double`}
    >
      <a-text value={label} align="center" position="0 0 0.01" color="#ffffff" scale="0.5 0.5 0.5"></a-text>
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
  // hacia él y sin heredar el cabeceo (solo yaw).
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
    <a-entity ref={rootRef}>
      {/* Fondo del panel */}
      <a-plane
        width="2.4"
        height="1.9"
        position="0 0.15 -0.03"
        material="shader: flat; color: #0c0f1e; opacity: 0.9; transparent: true; side: double"
      ></a-plane>

      <a-text
        value="MAPA DEL CAMPUS"
        align="center"
        position="0 1.0 0"
        color="#e0e4eb"
        scale="0.6 0.6 0.6"
      ></a-text>

      {/* Plano del nivel (textura + flecha del usuario las maneja vr-map-plano) */}
      <a-plane
        vr-map-plano={`level: ${activeLevel}; height: ${PANEL_HEIGHT}`}
        position="0 0.15 0"
        material="shader: flat; color: #ffffff; side: double"
      ></a-plane>

      {/* Selector de niveles (4-3-2-1) */}
      {[4, 3, 2, 1].map((level, i) => (
        <VRButton
          key={level}
          label={String(level)}
          active={activeLevel === level}
          onSelect={() => setActiveLevel(level)}
          position={`${-0.45 + i * 0.3} -0.75 0.02`}
        />
      ))}

      {/* Cerrar */}
      <VRButton
        label="X"
        active={false}
        onSelect={onClose}
        position="1.05 0.9 0.02"
        width={0.2}
        height={0.2}
      />
    </a-entity>
  );
};
