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
import { MinimapWidget } from './MinimapWidget';
import { CampusMapPage } from '../pages/CampusMapPage';
import { VRCampusMap } from './VRCampusMap';

export const SceneViewer = () => {
  const wrapperRef = useRef(null);
  const sceneRef = useRef(null);
  const [modalEvent, setModalEvent] = useState(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isVRMapOpen, setIsVRMapOpen] = useState(false);

  const { scene, loading, cameraYaw, isTransitioning, handleNavigationTransition, cameraRef } = useTourNavigation();
  const { events, eventsLoading, eventsError, activeSkyAssetId, allAssetsToLoad, updateEventCoords } = useSceneData(scene);
  const { isFullscreen, toggleFullscreen, enableHandTracking, isInVR } = useXR(wrapperRef, sceneRef, scene);

  // Refrescar raycasters de A-Frame una sola vez, tras cargar el escenario y sus
  // eventos (antes eran dos useEffect separados con temporizadores propios que
  // disparaban refreshObjects() por duplicado en cada carga de escena).
  useEffect(() => {
    if (scene) {
      const timeout = setTimeout(() => {
        document.querySelectorAll('[raycaster]').forEach(el => {
          try {
            if (el.components?.raycaster?.refreshObjects) {
              el.components.raycaster.refreshObjects();
            }
          } catch (e) {
            console.warn("A-Frame raycaster refresh warning:", e);
          }
        });
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [scene]);

  // El minimapa 3D de muñeca (vr-minimap) emite este evento al clickearse en VR.
  useEffect(() => {
    const open = () => setIsVRMapOpen(true);
    window.addEventListener('vr-minimap-open', open);
    return () => window.removeEventListener('vr-minimap-open', open);
  }, []);

  useEffect(() => {
    if (events.length === 0) return;
    const timeout = setTimeout(() => {
      document.querySelectorAll('[raycaster]').forEach(el => {
        try {
          if (el.components?.raycaster?.refreshObjects) {
            el.components.raycaster.refreshObjects();
          }
        } catch (e) {
          console.warn("A-Frame raycaster refresh warning:", e);
        }
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [scene, events]);

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

      {/* UI devuelta a su lugar correcto, fuera del 3D */}
      <MinimapWidget currentScene={scene} onOpen={() => setIsMapOpen(true)} />
      {isMapOpen && <CampusMapPage onClose={() => setIsMapOpen(false)} currentScene={scene} />}

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

        <VRControls
          cameraRef={cameraRef}
          cameraYaw={cameraYaw}
          enableHandTracking={enableHandTracking}
          sceneOffset={scene.coordinacionAngulo || 0}
        />

        {scene.conexiones.map((conexion, index) => (
          <ConnectionMarker
            key={`${scene.subId}-conn-${conexion.targetSubId}-${index}`}
            conexion={conexion}
            onNavigate={handleNavigationTransition}
          />
        ))}

        {!eventsLoading && !eventsError && events.map((event, index) => (
          <EventMarker
            key={`${scene.subId}-evt-${event._id || event.id}-${index}`}
            event={event}
            onOpenModal={(ev) => setModalEvent(ev)}
            isHidden={modalEvent != null && (event._id || event.id) === (modalEvent._id || modalEvent.id)}
          />
        ))}

        {isInVR && modalEvent && (
          <VREventDetailPanel event={modalEvent} cameraRef={cameraRef} onClose={() => setModalEvent(null)} />
        )}

        {isInVR && isVRMapOpen && (
          <VRCampusMap cameraRef={cameraRef} onClose={() => setIsVRMapOpen(false)} />
        )}
      </a-scene>

      {!isInVR && modalEvent && (
        <EventModal modalEvent={modalEvent} onClose={() => setModalEvent(null)} />
      )}
    </div>
  );
};