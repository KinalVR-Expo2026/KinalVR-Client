import { useState, useEffect, useRef, useCallback } from 'react';
import { useTourStore } from '../store/useTourStore';

export const useTourNavigation = () => {
  const activeSubId = useTourStore((state) => state.activeSubId);
  const setActiveSubId = useTourStore((state) => state.setActiveSubId);
  const fetchSceneData = useTourStore((state) => state.fetchSceneData);
  const preloadAdjacentScenes = useTourStore((state) => state.preloadAdjacentScenes);
  
  const [scene, setScene] = useState(null);
  const [loading, setLoading] = useState(true);

  const [pendingNextSubId, setPendingNextSubId] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [cameraYaw, setCameraYaw] = useState(0);
  
  const previousSubId = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const loadScene = async () => {
      if (activeSubId === pendingNextSubId) return;
      if (!isTransitioning) setLoading(true); 

      try {
        const data = await fetchSceneData(activeSubId);
        
        if (isMounted && data) {
          setScene(data);

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
  }, [activeSubId, fetchSceneData, preloadAdjacentScenes, pendingNextSubId, isTransitioning]);

  const handleNavigationTransition = useCallback((targetId) => {
    if (!cameraRef.current || isTransitioning) return;
    
    setPendingNextSubId(targetId);
    setIsTransitioning(true);
    cameraRef.current.emit('zoomInStart');
  }, [isTransitioning]);

  useEffect(() => {
    const cameraEl = cameraRef.current;
    if (!cameraEl) return;

    const handleAnimationComplete = (event) => {
      const animationName = event.detail.name;
      
      if (animationName === 'animation__zoomin') {
        if (pendingNextSubId) {
          const nextScene = useTourStore.getState().scenesCache[pendingNextSubId];
          
          if (nextScene && nextScene.conexiones) {
            const backConnection = nextScene.conexiones.find(c => c.targetSubId === activeSubId);
            
            if (backConnection && backConnection.rotation) {
              const yRot = parseFloat(backConnection.rotation.split(' ')[1]);
              setCameraYaw((yRot + 180) % 360);
            } else {
              setCameraYaw(0);
            }
          }

          if (cameraEl.components['look-controls']) {
            cameraEl.components['look-controls'].pitchObject.rotation.x = 0;
            cameraEl.components['look-controls'].yawObject.rotation.y = 0;
          }

          previousSubId.current = activeSubId;
          setActiveSubId(pendingNextSubId); 
          setPendingNextSubId(null);
          
          requestAnimationFrame(() => {
            cameraEl.emit('zoomOutStart');
          });
        }
      }
      
      if (animationName === 'animation__zoomout') {
        setIsTransitioning(false);
      }
    };

    cameraEl.addEventListener('animationcomplete', handleAnimationComplete);
    return () => {
      cameraEl.removeEventListener('animationcomplete', handleAnimationComplete);
    };
  }, [pendingNextSubId, setActiveSubId, activeSubId]);

  return {
    scene,
    loading,
    cameraYaw,
    isTransitioning,
    handleNavigationTransition,
    cameraRef
  };
};