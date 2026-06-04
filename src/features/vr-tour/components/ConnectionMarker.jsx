import 'aframe';
import { useEffect, useRef } from 'react';
import { useTourStore } from '../store/useTourStore';

const DISCO_FONDO_COLOR = "#0c0909";
const BORDE_ANILLO_COLOR = "#271adb";
const FLECHA_CHEVRON_COLOR = "#e2e7e7";
const TEXTO_ETIQUETA_COLOR = "#ffffff";
const AREA_SELECCION_COLOR = "#4b6ccc";

export const ConnectionMarker = ({ conexion, onNavigate }) => {
  const markerRef = useRef(null);
  
  const isAdminMode = useTourStore((state) => state.isAdminMode);
  const selectedConnectionId = useTourStore((state) => state.selectedConnectionId);
  const setSelectedConnectionId = useTourStore((state) => state.setSelectedConnectionId);

  const isSelected = isAdminMode && (selectedConnectionId === conexion.targetSubId);

  useEffect(() => {
    const el = markerRef.current;
    if (!el) return;

    const handleInteraction = (e) => {
      e.stopPropagation();
      if (isAdminMode) {
        setSelectedConnectionId(conexion.targetSubId);
      } else {
        onNavigate(conexion.targetSubId);
      }
    };

    // Añadido 'click' para soportar interacciones láser/hand-tracking en VR
    el.addEventListener('click', handleInteraction);
    el.addEventListener('mousedown', handleInteraction);
    el.addEventListener('touchstart', handleInteraction);
    
    return () => {
      el.removeEventListener('click', handleInteraction);
      el.removeEventListener('mousedown', handleInteraction);
      el.removeEventListener('touchstart', handleInteraction);
    };
  }, [conexion, onNavigate, isAdminMode, setSelectedConnectionId]);

  return (
    <a-entity
      ref={markerRef}
      position={conexion.position}
      rotation={conexion.rotation}
      className="clickable"
      geometry="primitive: sphere; radius: 0.2"
      material="opacity: 0; transparent: true"
      animation__mouseenter="property: scale; to: 1.2 1.2 1.2; startEvents: mouseenter; dur: 200"
      animation__mouseleave="property: scale; to: 1 1 1; startEvents: mouseleave; dur: 200"
    >
      {/* Grupo animado para el flotado suave */}
      <a-entity>
        {/* Disco de fondo */}
        <a-circle
          radius="0.25"
          color={DISCO_FONDO_COLOR}
          opacity="0.65"
          rotation="-90 0 0"
          material="shader: flat; transparent: true"
        ></a-circle>

        {/* Borde circular */}
        <a-ring
          radius-inner="0.23"
          radius-outer="0.25"
          color={BORDE_ANILLO_COLOR}
          opacity="0.9"
          rotation="-90 0 0"
          material="shader: flat; transparent: true"
        ></a-ring>

        {/* Flecha central (Chevron) */}
        <a-triangle
          vertex-a="0 0.13 0"
          vertex-b="-0.09 -0.06 0"
          vertex-c="0.09 -0.06 0"
          color={FLECHA_CHEVRON_COLOR}
          position="0 0.01 0"
          rotation="-90 0 0"
          material="shader: flat; transparent: true; opacity: 0.95"
        ></a-triangle>
      </a-entity>
      <a-text 
        value={conexion.targetSubId.replace(/_/g, ' ')} 
        align="center" 
        position="0 0.45 0" 
        color={TEXTO_ETIQUETA_COLOR}
        scale="0.65 0.65 0.65"
      ></a-text>

      {isSelected && (
        <a-entity
          geometry="primitive: sphere; radius: 0.35"
          material={`color: ${AREA_SELECCION_COLOR}; wireframe: true; opacity: 0.8; transparent: true`}
          animation="property: rotation; to: 0 360 0; loop: true; dur: 4000; easing: linear"
        ></a-entity>
      )}
    </a-entity>
  );
};