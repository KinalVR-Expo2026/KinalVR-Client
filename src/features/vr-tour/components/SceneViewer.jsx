import 'aframe';
import { useEffect, useState } from 'react';
import { useTourNavigation } from '../hooks/useTourNavigation';
import { ConnectionMarker } from './ConnectionMarker';
import { EventMarker } from './EventMarker';
import { getHighResTextureUrl } from '../../../shared/utils/imageUtils';

const API_BASE_URL = import.meta.env.VITE_ADMIN_URL;

export const SceneViewer = () => {
  const { 
    scene, 
    loading, 
    cameraYaw, 
    isTransitioning, 
    handleNavigationTransition, 
    cameraRef 
  } = useTourNavigation();
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState(null);

  useEffect(() => {
    if (!scene || !API_BASE_URL) return undefined;

    const controller = new AbortController();
    const sceneId = scene._id || scene.idEscenario?._id || scene.idEscenario || scene.subId;
    console.log("SceneViewer: escenario actual:", scene);
    console.log("SceneViewer: calculando sceneId:", sceneId);

    const normalizeEvents = (payload) => {
      if (Array.isArray(payload.events)) return payload.events;
      if (Array.isArray(payload.eventos)) return payload.eventos;
      if (Array.isArray(payload)) return payload;
      return [];
    };

    const loadEvents = async () => {
      setEventsLoading(true);
      setEventsError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/events/escenario/${sceneId}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`No se pudieron cargar los eventos (${response.status})`);
        }

        const data = await response.json();
        console.log("Datos de eventos recibidos del servidor:", data);
        const normalized = normalizeEvents(data);
        console.log("Eventos normalizados a renderizar:", normalized);
        setEvents(normalized);
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') return;
        console.error("Error cargando eventos:", fetchError);
        setEventsError('No se pudieron cargar los eventos de este escenario.');
        setEvents([]);
      } finally {
        if (!controller.signal.aborted) {
          setEventsLoading(false);
        }
      }
    };

    loadEvents();

    return () => controller.abort();
  }, [scene]);

  if (loading && !isTransitioning) {
    return (
      <div className="flex h-full w-full items-center justify-center font-[var(--font-sans)] text-white bg-black/50">
        <p className="animate-pulse tracking-[4px]">CARGANDO ENTORNO...</p>
      </div>
    );
  }

  if (!scene) {
    return (
      <div className="flex h-full w-full items-center justify-center text-red-500">
        <p>Error al cargar el escenario.</p>
      </div>
    );
  }

  const textureUrl = getHighResTextureUrl(scene.urlImagen);
  console.log("Cargando textura de fondo:", textureUrl);
  const skyAssetId = `sky-${textureUrl.replace(/[^a-zA-Z0-9]/g, '-')}`;
 
  return (
    <div className="h-full w-full relative">
      <a-scene 
        embedded 
        antialias="true" 
        style={{ width: '100%', height: '100%' }} 
        cursor="rayOrigin: mouse" 
        raycaster="objects: .clickable"
        webxr="referenceSpaceType: local"
      >
        <a-assets></a-assets>
 
        <a-sky src={textureUrl} rotation="0 -90 0" crossOrigin="anonymous"></a-sky>

        <a-entity id="camera-wrapper" rotation={`0 ${cameraYaw} 0`}>
          <a-entity 
            camera 
            ref={cameraRef}
            look-controls="reverseMouseDrag: false" 
            position="0 1.6 0"
            animation__zoomin="property: camera.fov; to: 20; dur: 350; easing: linear; startEvents: zoomInStart; resumeEvents: zoomInStart"
            animation__zoomout="property: camera.fov; to: 80; dur: 500; easing: easeOutQuad; startEvents: zoomOutStart; resumeEvents: zoomOutStart"
          ></a-entity>

          {/* Soporte para Hand Tracking y Mandos VR (Meta Quest 3S) */}
          <a-entity 
            laser-controls="hand: left" 
            raycaster="objects: .clickable; far: 50" 
            line="color: #f97316; opacity: 0.7"
          ></a-entity>
          <a-entity 
            laser-controls="hand: right" 
            raycaster="objects: .clickable; far: 50" 
            line="color: #f97316; opacity: 0.7"
          ></a-entity>
          
          <a-entity hand-tracking-controls="hand: left"></a-entity>
          <a-entity hand-tracking-controls="hand: right"></a-entity>
        </a-entity>

        {scene.conexiones.map((conexion) => (
          <ConnectionMarker 
            key={conexion.targetSubId} 
            conexion={conexion} 
            onNavigate={handleNavigationTransition} 
          />
        ))}

        {!eventsLoading && !eventsError && events.map((event) => (
          <EventMarker
            key={event._id || event.id}
            event={event}
          />
        ))}
      </a-scene>
    </div>
  );
};