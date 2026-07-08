import 'aframe';
import { useCallback, useEffect, useRef, useState } from 'react';
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

  // Reconstruye la lista de objetos apuntables de cada raycaster de A-Frame
  // (.clickable / .vrmap-target). Una sola pasada.
  const refreshRaycasters = useCallback(() => {
    document.querySelectorAll('[raycaster]').forEach((el) => {
      try {
        el.components?.raycaster?.refreshObjects?.();
      } catch (e) {
        console.warn('A-Frame raycaster refresh warning:', e);
      }
    });
  }, []);

  // Escalonado en varios instantes: las entidades (marcadores, minimapa de muñeca,
  // controllers al entrar a VR) no siempre están listas en un único momento. Un
  // refresh de un solo disparo perdía la carrera y el minimapa de muñeca a veces
  // no quedaba apuntable hasta cambiar de escena (bug de apertura intermitente).
  // `delays` es configurable: la apertura del mapa VR usa una ventana más corta
  // ([50, 250, 600]) que el default, porque su panel debe quedar apuntable antes
  // de que el usuario alcance a gatillar (ver el efecto de isVRMapOpen abajo).
  const scheduleStaggeredRefresh = useCallback((delays = [150, 500, 1000, 1800]) => {
    const timers = delays.map((ms) => setTimeout(refreshRaycasters, ms));
    return () => timers.forEach(clearTimeout);
  }, [refreshRaycasters]);

  // Tras cargar la escena y sus eventos.
  useEffect(() => {
    if (!scene) return;
    return scheduleStaggeredRefresh();
  }, [scene, events, scheduleStaggeredRefresh]);

  // Al entrar a VR se inicializan los raycasters de las manos y deben recoger el
  // minimapa de muñeca (.vrmap-target); sin esto el primer intento de abrir el
  // mapa a veces no registraba el clic.
  useEffect(() => {
    const sceneEl = sceneRef.current;
    if (!sceneEl) return;
    const onEnterVR = () => scheduleStaggeredRefresh();
    sceneEl.addEventListener('enter-vr', onEnterVR);
    return () => sceneEl.removeEventListener('enter-vr', onEnterVR);
  }, [scheduleStaggeredRefresh]);

  // El minimapa 3D de muñeca (vr-minimap) emite este evento al clickearse en VR.
  // También escucha el botón Y del mando izquierdo (vr-map-toggle) para toggle.
  useEffect(() => {
    const toggle = () => setIsVRMapOpen((v) => !v);
    window.addEventListener('vr-minimap-open', toggle);
    window.addEventListener('vr-map-toggle', toggle);
    return () => {
      window.removeEventListener('vr-minimap-open', toggle);
      window.removeEventListener('vr-map-toggle', toggle);
    };
  }, []);

  // Al abrir el mapa VR sus botones/plano recién montados aún no están en la
  // whitelist del raycaster (esta era la otra mitad del bug crítico: el rayo
  // los atravesaba como si no existieran). Ventana corta porque VRCampusMap
  // también tiene su propia ventana de gracia anti-carrera para el cierre.
  useEffect(() => {
    if (!isVRMapOpen) return;
    return scheduleStaggeredRefresh([50, 250, 600]);
  }, [isVRMapOpen, scheduleStaggeredRefresh]);

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
      {isMapOpen && <CampusMapPage onClose={() => setIsMapOpen(false)} currentScene={scene} onNavigate={handleNavigationTransition} />}

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
          <VRCampusMap
            cameraRef={cameraRef}
            onClose={() => setIsVRMapOpen(false)}
            onTeleport={(subId) => {
              setIsVRMapOpen(false);
              handleNavigationTransition(subId);
            }}
          />
        )}
      </a-scene>

      {!isInVR && modalEvent && (
        <EventModal modalEvent={modalEvent} onClose={() => setModalEvent(null)} />
      )}
    </div>
  );
};