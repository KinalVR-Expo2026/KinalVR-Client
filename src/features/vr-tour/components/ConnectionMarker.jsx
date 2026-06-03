import 'aframe';
import { useEffect, useRef } from 'react';
import rightArrowImg from '../../../assets/img/right-arrow.png';

export const ConnectionMarker = ({ conexion, onNavigate }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    const el = markerRef.current;
    if (!el) return;

    const handleInteraction = (e) => {
      e.stopPropagation();
      onNavigate(conexion.targetSubId);
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
  }, [conexion, onNavigate]);

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
    </a-entity>
  );
};