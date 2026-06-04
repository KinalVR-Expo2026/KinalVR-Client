import 'aframe';
import { useEffect, useRef } from 'react';
import { useTourStore } from '../store/useTourStore';
import rightArrowImg from '../../../assets/img/right-arrow.png';

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
      <a-image 
        src={rightArrowImg}
        width="0.5" 
        height="0.6" 
        rotation="45 0 0" 
        opacity="0.85"
        transparent="true"
      ></a-image>
      <a-text 
        value={conexion.targetSubId.replace(/_/g, ' ')} 
        align="center" 
        position="0 0.6 0" 
        color="#FFFFFF"
        scale="0.8 0.8 0.8"
      ></a-text>

      {isSelected && (
        <a-entity
          geometry="primitive: sphere; radius: 0.35"
          material="color: #ea580c; wireframe: true; opacity: 0.8; transparent: true"
          animation="property: rotation; to: 0 360 0; loop: true; dur: 4000; easing: linear"
        ></a-entity>
      )}
    </a-entity>
  );
};