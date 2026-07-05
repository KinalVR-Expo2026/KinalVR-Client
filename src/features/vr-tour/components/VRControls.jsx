import { useEffect, useRef } from 'react';
import { registerVRComponents } from '../aframe/registerVRComponents';
import { registerVRMinimap } from '../aframe/vrMinimap';

// Registramos los componentes A-Frame de controles + el minimapa 3D. Son
// idempotentes, así que llamarlas al importar el módulo (y en cada montaje) es
// seguro.
registerVRComponents();
registerVRMinimap();

export const VRControls = ({ cameraRef, cameraYaw, sceneOffset }) => {
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
        minimap-sync
        data-offset={sceneOffset}
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
      >
        {/* Minimapa 3D de muñeca: solo visible en VR. Usa una clase propia
            (`vrmap-target`) para que SOLO la mano derecha lo apunte/clickee — así
            la propia mano izquierda que lo porta no se auto-intersecta (evita
            desactivar su joystick de giro ni abrir el mapa sin querer).
            Posición/rotación sobre la muñeca a calibrar en casco. */}
        <a-entity
          className="vrmap-target"
          vr-minimap
          position="0 0.04 0.06"
          rotation="-50 0 0"
        ></a-entity>
      </a-entity>

      {/* Mano Derecha (además apunta al minimapa de muñeca: .vrmap-target) */}
      <a-entity
        hand-tracking-controls="hand: right"
        laser-controls="hand: right"
        raycaster="objects: .clickable, .vrmap-target; far: 50; showLine: true"
        vr-only-line="color: #f97316; opacity: 0.7"
        thumbstick-turning="turnAngle: 45"
        hand-pinch-click
        hand-joystick-turn="speed: 1.5; deadzone: 0.02"
      ></a-entity>
    </a-entity>
  );
};