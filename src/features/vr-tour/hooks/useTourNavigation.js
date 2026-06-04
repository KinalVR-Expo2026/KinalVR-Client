import { useState, useEffect, useRef, useCallback } from 'react';
import { useTourStore } from '../store/useTourStore';

export const useTourNavigation = () => {
  const activeSubId = useTourStore((state) => state.activeSubId);
  const setActiveSubId = useTourStore((state) => state.setActiveSubId);
  const fetchSceneData = useTourStore((state) => state.fetchSceneData);
  const preloadAdjacentScenes = useTourStore((state) => state.preloadAdjacentScenes);

  const scene = useTourStore((state) => state.scenesCache[activeSubId]);
  const [loading, setLoading] = useState(!scene);

  const [pendingNextSubId, setPendingNextSubId] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [cameraYaw, setCameraYaw] = useState(0);

  const previousSubId = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const loadScene = async () => {
      if (activeSubId === pendingNextSubId) return;
      if (!scene && !isTransitioning) setLoading(true);

      try {
        const data = await fetchSceneData(activeSubId);

        if (isMounted && data) {
          if (!previousSubId.current && data.subId === 'entrada') {
            setCameraYaw(180);
          }

          if (data.conexiones && data.conexiones.length > 0) {
            preloadAdjacentScenes(data.conexiones);
          }
        }
      } catch (error) {
        console.error("Fallo al cargar la escena de KinalVR", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadScene();

    return () => { isMounted = false; };
  }, [activeSubId, fetchSceneData, preloadAdjacentScenes, pendingNextSubId, isTransitioning, scene]);

  const handleNavigationTransition = useCallback((targetId) => {
    if (!cameraRef.current || isTransitioning) return;

    setPendingNextSubId(targetId);
    setIsTransitioning(true);
    
    // WebXR Safe Transition (Blink transition instead of FOV/Spheres to prevent A-Frame rendering bugs)
    setTimeout(() => {
      const nextScene = useTourStore.getState().scenesCache[targetId.trim()];
      if (nextScene && nextScene.conexiones) {
        const backConnection = nextScene.conexiones.find(c => c.targetSubId?.trim() === activeSubId?.trim());
        if (backConnection && backConnection.rotation) {
          const yRot = parseFloat(backConnection.rotation.split(' ')[1]);
          setCameraYaw((yRot + 180) % 360);
        } else {
          setCameraYaw(0);
        }
      }

      const cameraEl = cameraRef.current;
      if (cameraEl && cameraEl.components['look-controls']) {
        cameraEl.components['look-controls'].pitchObject.rotation.x = 0;
        cameraEl.components['look-controls'].yawObject.rotation.y = 0;
      }

      previousSubId.current = activeSubId;
      setActiveSubId(targetId);
      setPendingNextSubId(null);

      setTimeout(() => {
        setIsTransitioning(false);
      }, 50); 
    }, 150); 
  }, [isTransitioning, activeSubId, setActiveSubId]);

  return {
    scene,
    loading,
    cameraYaw,
    isTransitioning,
    handleNavigationTransition,
    cameraRef
  };
};