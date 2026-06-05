import 'aframe';
import { useEffect, useRef } from 'react';
import { useTourStore } from '../store/useTourStore';

const AREA_SELECCION_COLOR = "#f97316";

export const EventMarker = ({ event, onOpenModal }) => {
  const markerRef = useRef(null);
  
  const isAdminMode = useTourStore((state) => state.isAdminMode);
  const selectedEventId = useTourStore((state) => state.selectedEventId);
  const setSelectedEventId = useTourStore((state) => state.setSelectedEventId);

  const isSelected = isAdminMode && (selectedEventId === event._id);

  useEffect(() => {
    const el = markerRef.current;
    if (!el) return;

    const handleInteraction = (e) => {
      e.stopPropagation();
      if (isAdminMode) {
        setSelectedEventId(event._id);
      } else if (typeof onOpenModal === 'function') {
        onOpenModal(event);
      }
    };

    el.addEventListener('click', handleInteraction);
    el.addEventListener('mousedown', handleInteraction);
    el.addEventListener('touchstart', handleInteraction);
    
    return () => {
      el.removeEventListener('click', handleInteraction);
      el.removeEventListener('mousedown', handleInteraction);
      el.removeEventListener('touchstart', handleInteraction);
    };
  }, [event, isAdminMode, setSelectedEventId, onOpenModal]);

  return (
    <a-entity
      ref={markerRef}
      position={event.position || "0 1 -3"}
      rotation={event.rotation || "0 0 0"}
      geometry="primitive: box; width: 0.8; height: 0.8; depth: 0.05"
      material="opacity: 0; transparent: true"
      className="clickable"
    >
      {event.urlImagen ? (
        <a-image
          src={event.urlImagen}
          width="0.75"
          height="0.75"
          position="0 0 0"
          crossOrigin="anonymous"
          crossorigin="anonymous"
          transparent="true"
          opacity="0.95"
        />
      ) : (
        <a-circle
          radius="0.22"
          color="#f97316"
          opacity="0.9"
        />
      )}

      {event.descripcion ? (
        <a-text
          value={event.descripcion}
          align="center"
          position="0 -0.55 0"
          color="#FFFFFF"
          width="2.5"
          wrap-count="24"
          scale="0.65 0.65 0.65"
        />
      ) : null}

      {isSelected && (
        <a-entity
          geometry="primitive: sphere; radius: 0.5"
          material={`color: ${AREA_SELECCION_COLOR}; wireframe: true; opacity: 0.8; transparent: true`}
          animation="property: rotation; to: 0 360 0; loop: true; dur: 4000; easing: linear"
        ></a-entity>
      )}
    </a-entity>
  );
};