import 'aframe';
import { useEffect, useRef, useState } from 'react';
import { useTourStore } from '../store/useTourStore';

const AREA_SELECCION_COLOR = "#f97316";

export const EventMarker = ({ event, onOpenModal, isHidden = false }) => {
  const markerRef = useRef(null);
  const imgRef = useRef(null);
  const [imgSize, setImgSize] = useState({ width: 0.75, height: 0.75 });

  const isAdminMode = useTourStore((state) => state.isAdminMode);
  const selectedEventId = useTourStore((state) => state.selectedEventId);
  const setSelectedEventId = useTourStore((state) => state.setSelectedEventId);

  const isSelected = isAdminMode && (selectedEventId === event._id);

  // Refresh all raycasters when this marker mounts so VR controllers can detect it.
  // Events are loaded asynchronously via API, so these markers mount AFTER the initial
  // raycaster.refreshObjects() that runs when the scene loads — without this, the VR
  // controller raycasters don't know about EventMarker entities and clicks won't register.
  useEffect(() => {
    const timer = setTimeout(() => {
      const raycasters = document.querySelectorAll('[raycaster]');
      raycasters.forEach(el => {
        if (el.components && el.components.raycaster) {
          el.components.raycaster.refreshObjects();
        }
      });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Hide/show the marker when the detail modal is open for this event
  useEffect(() => {
    const el = markerRef.current;
    if (!el || !el.object3D) return;
    el.object3D.visible = !isHidden;
  }, [isHidden]);

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

  useEffect(() => {
    if (!event.urlImagen) return;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = event.urlImagen;
    const DEFAULT_WIDTH = 0.75;

    const applySize = (w, h) => {
      // update state so React re-renders attributes
      setImgSize({ width: w, height: h });

      // update parent geometry (hitbox) if markerRef is available
      const parent = markerRef.current;
      if (parent) {
        parent.setAttribute('geometry', `primitive: box; width: ${w}; height: ${h}; depth: 0.05`);

        // Refresh raycasters after geometry change so VR controllers
        // can detect the new mesh (the old one was replaced).
        setTimeout(() => {
          document.querySelectorAll('[raycaster]').forEach(el => {
            if (el.components && el.components.raycaster) {
              el.components.raycaster.refreshObjects();
            }
          });
        }, 50);
      }
    };

    img.onload = () => {
      const ratio = img.naturalHeight / img.naturalWidth || 1;
      const h = +(DEFAULT_WIDTH * ratio).toFixed(4);
      applySize(DEFAULT_WIDTH, h);
    };

    img.onerror = () => {
      applySize(DEFAULT_WIDTH, DEFAULT_WIDTH);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [event.urlImagen]);

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
          ref={imgRef}
          src={event.urlImagen}
          width={imgSize.width}
          height={imgSize.height}
          position="0 0 0"
          crossOrigin="anonymous"
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