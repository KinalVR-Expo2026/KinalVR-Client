import 'aframe';
import { useEffect, useRef, useState } from 'react';
import { useTourNavigation } from '../hooks/useTourNavigation';
import { ConnectionMarker } from './ConnectionMarker';
import { EventMarker } from './EventMarker';
import { VREventDetailPanel } from './VREventDetailPanel';
import { VRControls } from './VRControls';
import { getHighResTextureUrl } from '../../../shared/utils/imageUtils';

import { useSceneData, generateAssetId } from '../hooks/useSceneData';
import { useXR } from '../hooks/useXR';
import { AdminOverlay } from './AdminOverlay';
import { EventModal } from './EventModal';

export const SceneViewer = () => {
  const wrapperRef = useRef(null);
  const sceneRef = useRef(null);
  const [modalEvent, setModalEvent] = useState(null);

  const { scene, loading, cameraYaw, isTransitioning, handleNavigationTransition, cameraRef } = useTourNavigation();
  const { events, eventsLoading, eventsError, activeSkyAssetId, allAssetsToLoad, updateEventCoords } = useSceneData(scene);
  const { isFullscreen, toggleFullscreen, enableHandTracking, isInVR } = useXR(wrapperRef, sceneRef, scene);

  // Refrescar raycasters de A-Frame cuando el escenario o los eventos cambian
  useEffect(() => {
    if (scene) {
      const timeout = setTimeout(() => {
        document.querySelectorAll('[raycaster]').forEach(el => el.components?.raycaster?.refreshObjects());
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [scene]);

  useEffect(() => {
    if (events.length === 0) return;
    const timeout = setTimeout(() => {
      document.querySelectorAll('[raycaster]').forEach(el => el.components?.raycaster?.refreshObjects());
    }, 300);
    return () => clearTimeout(timeout);
  }, [events]);

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
  const skyAssetId = generateAssetId(textureUrl);

  return (
    <div ref={wrapperRef} className="h-full w-full relative">
      <AdminOverlay
        scene={scene}
        events={events}
        updateEventCoords={updateEventCoords}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
      />

      <a-scene
        webxr="optionalFeatures: hand-tracking, layers; referenceSpaceType: local-floor"
        ref={sceneRef}
        embedded
        antialias="true"
        style={{ width: '100%', height: '100%' }}
        cursor="rayOrigin: mouse"
        raycaster="objects: .clickable"
        xr-mode-ui="enterVREnabled: true; enterAREnabled: false"
      >
        <a-assets timeout="10000">
          {allAssetsToLoad.map((url) => (
            <img key={generateAssetId(url)} id={generateAssetId(url)} src={url} crossOrigin="anonymous" />
          ))}
        </a-assets>

        <a-sky src={activeSkyAssetId ? `#${activeSkyAssetId}` : `#${skyAssetId}`} rotation="0 -90 0" crossOrigin="anonymous"></a-sky>

        <VRControls cameraRef={cameraRef} cameraYaw={cameraYaw} enableHandTracking={enableHandTracking} />

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
            onOpenModal={(ev) => setModalEvent(ev)}
            isHidden={modalEvent != null && (event._id || event.id) === (modalEvent._id || modalEvent.id)}
          />
        ))}

        {isInVR && modalEvent && (
          <VREventDetailPanel event={modalEvent} cameraRef={cameraRef} onClose={() => setModalEvent(null)} />
        )}
      </a-scene>

      {!isInVR && modalEvent && (
        <EventModal modalEvent={modalEvent} onClose={() => setModalEvent(null)} />
      )}
    </div>
  );
};