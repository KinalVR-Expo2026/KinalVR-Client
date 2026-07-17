import { useState, useEffect, useMemo } from 'react';
import { getHighResTextureUrl, getLowResTextureUrl, isImageCached, setAsCached } from '../../../shared/utils/imageUtils';
import { useTourStore } from '../store/useTourStore';

export const generateAssetId = (url) => {
  if (!url) return 'default-sky';
  const isLowRes = url.includes('e_blur');
  const type = isLowRes ? 'low' : 'high';
  return `asset-${type}-${url.replace(/[^a-zA-Z0-9]/g, '').slice(-35)}`;
};

export const useSceneData = (scene) => {
  // Inicializamos directamente con los eventos que ya vienen empaquetados desde zustand
  const [events, setEvents] = useState(scene?.eventos || []);
  const [activeSkyAssetId, setActiveSkyAssetId] = useState(null);

  const preloadedImages = useTourStore((state) => state.preloadedImages);

  // Sincronizamos si la escena actual cambia
  useEffect(() => {
    if (scene && scene.eventos) {
      setEvents(scene.eventos);
    } else {
      setEvents([]);
    }
  }, [scene]);

  useEffect(() => {
    if (!scene) return;
    let isMounted = true;
    const lowResUrl = getLowResTextureUrl(scene.urlImagen);
    const highResUrl = getHighResTextureUrl(scene.urlImagen);
    const lowResId = generateAssetId(lowResUrl);
    const highResId = generateAssetId(highResUrl);

    if (isImageCached(highResUrl)) {
      setActiveSkyAssetId(highResId);
      return;
    }

    setActiveSkyAssetId(lowResId);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = highResUrl;
    img.onload = () => {
      setAsCached(highResUrl);
      if (isMounted) setActiveSkyAssetId(highResId);
    };

    return () => { isMounted = false; };
  }, [scene]);

  const allAssetsToLoad = useMemo(() => {
    if (!scene) return preloadedImages;
    const lowResUrl = getLowResTextureUrl(scene.urlImagen);
    const highResUrl = getHighResTextureUrl(scene.urlImagen);
    return Array.from(new Set([lowResUrl, highResUrl, ...preloadedImages]));
  }, [scene, preloadedImages]);

  const updateEventCoords = (eventId, { position, rotation }) => {
    setEvents((prev) => prev.map((ev) => {
      const id = ev._id || ev.id;
      if (id === eventId) {
        return { ...ev, position: position !== undefined ? position : ev.position, rotation: rotation !== undefined ? rotation : ev.rotation };
      }
      return ev;
    }));
  };

  // Como los datos ya están en memoria, forzamos false en la carga para no interrumpir el UI
  return { events, eventsLoading: false, eventsError: null, activeSkyAssetId, allAssetsToLoad, updateEventCoords };
};