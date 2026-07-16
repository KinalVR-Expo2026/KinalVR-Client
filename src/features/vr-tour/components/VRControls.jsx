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
        look-controls="reverseMouseDrag: false; magicWindowTrackingEnabled: false; touchEnabled: true"
        position="0 1.75 0"
        minimap-sync
        data-offset={sceneOffset}
      ></a-entity>

      {/* Mano Izquierda — naranja de marca (mando por emissive, manos por modelColor) */}
      <a-entity
        hand-tracking-controls="hand: left; modelColor: #f97316"
        laser-controls="hand: left"
        controller-tint="color: #f97316"
        raycaster="objects: .clickable; far: 50; showLine: true"
        vr-only-line="color: #f97316; opacity: 0.7"
        thumbstick-turning="turnAngle: 45"
        hand-pinch-click
        hand-joystick-turn="speed: 1.5; deadzone: 0.02"
        map-toggle-button
      >
        {/* Minimapa 3D de muñeca: solo visible en VR. Usa una clase propia
            (`vrmap-target`) para que SOLO la mano derecha lo apunte/clickee — así
            la propia mano izquierda que lo porta no se auto-intersecta (evita
            desactivar su joystick de giro ni abrir el mapa sin querer).
            Posición/rotación: a la izquierda del mando y un poco arriba, calibrable
            en casco. */}
        <a-entity
          className="vrmap-target"
          vr-minimap
          position="-0.05 0.08 0.02"
          rotation="-30 0 0"
        ></a-entity>
      </a-entity>

      {/* Mano Derecha — azul de marca (además apunta al minimapa de muñeca: .vrmap-target) */}
      <a-entity
        hand-tracking-controls="hand: right; modelColor: #4b6ccc"
        laser-controls="hand: right"
        controller-tint="color: #4b6ccc"
        raycaster="objects: .clickable, .vrmap-target; far: 50; showLine: true"
        vr-only-line="color: #4b6ccc; opacity: 0.7"
        thumbstick-turning="turnAngle: 45"
        hand-pinch-click
        hand-joystick-turn="speed: 1.5; deadzone: 0.02"
      ></a-entity>
    </a-entity>
  );
};