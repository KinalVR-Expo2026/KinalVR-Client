import 'aframe';
import { useTourNavigation } from '../hooks/useTourNavigation';
import { ConnectionMarker } from './ConnectionMarker';
import { getHighResTextureUrl } from '../../../shared/utils/imageUtils';

export const SceneViewer = () => {
  const { 
    scene, 
    loading, 
    cameraYaw, 
    isTransitioning, 
    handleNavigationTransition, 
    cameraRef 
  } = useTourNavigation();

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

        <a-sky src={textureUrl} rotation="0 -90 0"></a-sky>

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
      </a-scene>
    </div>
  );
};