import { create } from 'zustand';
import { getSceneBySubId, updateScene } from '../../../shared/api/admin';
import { getHighResTextureUrl, getLowResTextureUrl, preloadImage } from '../../../shared/utils/imageUtils';

const API_BASE_URL = import.meta.env.VITE_ADMIN_URL;

// Tope de URLs de textura retenidas en preloadedImages. Cada una queda como <img>
// dentro de <a-assets> (SceneViewer.jsx) mientras esté en esta lista, ocupando
// memoria de GPU como textura. Sin límite, una sesión larga de kiosco acumula
// las texturas de todas las escenas visitadas y nunca las libera.
const MAX_PRELOADED_IMAGES = 24;

const addPreloadedImages = (current, ...urls) => {
  const merged = [...new Set([...current, ...urls])];
  return merged.length > MAX_PRELOADED_IMAGES
    ? merged.slice(merged.length - MAX_PRELOADED_IMAGES)
    : merged;
};

export const useTourStore = create((set, get) => ({
  activeSubId: 'entrada',
  scenesCache: {},
  isAdminMode: false,
  selectedConnectionId: null,
  selectedEventId: null,
  
  preloadedImages: [], 

  setActiveSubId: (subId) => set({ activeSubId: subId ? subId.trim() : subId }),
  setAdminMode: (isAdmin) => set({ isAdminMode: isAdmin, selectedConnectionId: null, selectedEventId: null }),
  setSelectedConnectionId: (id) => set({ selectedConnectionId: id ? id.trim() : id, selectedEventId: null }),
  setSelectedEventId: (id) => set({ selectedEventId: id ? id.trim() : id, selectedConnectionId: null }),

  preloadInitialScene: async (subId) => {
    const { fetchSceneData, preloadAdjacentScenes } = get();
    const scene = await fetchSceneData(subId);
    
    if (scene) {
      if (scene.urlImagen) {
        const lowResUrl = getLowResTextureUrl(scene.urlImagen);
        const highResUrl = getHighResTextureUrl(scene.urlImagen);
        try {
          await preloadImage(lowResUrl);
          preloadImage(highResUrl).catch(() => {});

          set((state) => ({
            preloadedImages: addPreloadedImages(state.preloadedImages, lowResUrl, highResUrl)
          }));
        } catch (error) {
          console.error("Fallo al pre-cargar la imagen inicial:", error);
        }
      }
      if (scene.conexiones && scene.conexiones.length > 0) {
        preloadAdjacentScenes(scene.conexiones);
      }
    }
  },

  fetchSceneData: async (subId) => {
    const trimmedSubId = subId ? subId.trim() : subId;
    const { scenesCache } = get();
    if (scenesCache[trimmedSubId]) return scenesCache[trimmedSubId];

    try {
      // 1. Cargar datos base de la escena
      const data = await getSceneBySubId(trimmedSubId);

      // 2. Cargar eventos asociados y empaquetarlos inmediatamente
      let fetchedEvents = [];
      if (data && (data._id || data.idEscenario)) {
        const sceneId = data._id || data.idEscenario?._id || data.idEscenario;
        try {
          const response = await fetch(`${API_BASE_URL}/events/escenario/${sceneId}`);
          if (response.ok) {
            const eventData = await response.json();
            fetchedEvents = Array.isArray(eventData.events) ? eventData.events :
                            Array.isArray(eventData.eventos) ? eventData.eventos :
                            Array.isArray(eventData) ? eventData : [];
          }
        } catch (err) {
          console.error("Error al cargar eventos para la escena:", err);
        }
      }

      if (data) {
        data.eventos = fetchedEvents;
      }

      set((state) => ({
        scenesCache: { ...state.scenesCache, [trimmedSubId]: data }
      }));
      return data;
    } catch (error) {
      console.error("Error al cargar datos de la escena:", error);
      return null;
    }
  },

  preloadAdjacentScenes: async (conexiones) => {
    const { fetchSceneData } = get();

    await Promise.all(
      conexiones.map(async (conexion) => {
        const targetId = conexion.targetSubId;

        try {
          const sceneData = await fetchSceneData(targetId);

          if (sceneData && sceneData.urlImagen) {
            const lowResUrl = getLowResTextureUrl(sceneData.urlImagen);
            const highResUrl = getHighResTextureUrl(sceneData.urlImagen);

            await preloadImage(lowResUrl).catch((err) =>
              console.warn(`No se pudo precargar la textura de baja resolución para "${targetId}":`, err)
            );
            preloadImage(highResUrl).catch((err) =>
              console.warn(`No se pudo precargar la textura de alta resolución para "${targetId}":`, err)
            );

            set((state) => ({
              preloadedImages: addPreloadedImages(state.preloadedImages, lowResUrl, highResUrl)
            }));
          }
        } catch (error) {
          console.error(`Error al precargar la escena adyacente "${targetId}":`, error);
        }
      })
    );
  },

  updateConnectionCoords: (sceneSubId, targetSubId, { position, rotation }) => {
    const sId = sceneSubId ? sceneSubId.trim() : sceneSubId;
    const tId = targetSubId ? targetSubId.trim() : targetSubId;

    set((state) => {
      const scene = state.scenesCache[sId];
      if (!scene) return {};
      const updatedConexiones = scene.conexiones.map((c) => {
        if (c.targetSubId && c.targetSubId.trim() === tId) {
          const updated = { ...c };
          if (position !== undefined) updated.position = position;
          if (rotation !== undefined) updated.rotation = rotation;
          return updated;
        }
        return c;
      });
      return {
        scenesCache: {
          ...state.scenesCache,
          [sId]: { ...scene, conexiones: updatedConexiones }
        }
      };
    });
  },

  addConnection: (sceneSubId, targetSubId) => {
    const sId = sceneSubId ? sceneSubId.trim() : sceneSubId;
    const tId = targetSubId ? targetSubId.trim() : targetSubId;

    set((state) => {
      const scene = state.scenesCache[sId];
      if (!scene) return state;
      
      if (scene.conexiones && scene.conexiones.some(c => c.targetSubId === tId)) {
        return { selectedConnectionId: tId, selectedEventId: null };
      }

      const newConnection = {
        targetSubId: tId,
        // Debe coincidir con el default del servidor (conexionSchema en scene.model.js)
        position: '0 1 -3',
        rotation: '0 0 0'
      };

      return {
        scenesCache: {
          ...state.scenesCache,
          [sId]: { ...scene, conexiones: [...(scene.conexiones || []), newConnection] }
        },
        selectedConnectionId: tId,
        selectedEventId: null
      };
    });
  },

  removeConnection: (sceneSubId, targetSubId) => {
    const sId = sceneSubId ? sceneSubId.trim() : sceneSubId;
    const tId = targetSubId ? targetSubId.trim() : targetSubId;

    set((state) => {
      const scene = state.scenesCache[sId];
      if (!scene) return state;

      const filteredConexiones = (scene.conexiones || []).filter(c => c.targetSubId !== tId);

      return {
        scenesCache: {
          ...state.scenesCache,
          [sId]: { ...scene, conexiones: filteredConexiones }
        },
        selectedConnectionId: state.selectedConnectionId === tId ? null : state.selectedConnectionId
      };
    });
  },

  // Guarda los metadatos editables del escenario (subId, ubicacion, urlImagen).
  // Al cambiar subId hay que re-clavar la caché (que se indexa por subId) y, si es
  // la escena activa, actualizar activeSubId para que siga visible.
  saveSceneInfo: async (currentSubId, { subId, ubicacion, urlImagen }) => {
    const curId = currentSubId ? currentSubId.trim() : currentSubId;
    const { scenesCache } = get();
    const scene = scenesCache[curId];
    if (!scene || !scene._id) {
      throw new Error("No hay datos del escenario o falta el ID del escenario");
    }

    const payload = {};
    if (subId !== undefined) payload.subId = subId.trim();
    if (ubicacion !== undefined) payload.ubicacion = ubicacion;
    if (urlImagen !== undefined) payload.urlImagen = urlImagen;

    const updatedScene = await updateScene(scene._id, payload);
    // Los eventos vienen de un endpoint aparte y no los devuelve updateScene; conservarlos.
    updatedScene.eventos = scene.eventos;

    const newSubId = (updatedScene.subId || curId).trim();

    set((state) => {
      const newCache = { ...state.scenesCache };
      delete newCache[curId];
      newCache[newSubId] = updatedScene;
      return {
        scenesCache: newCache,
        activeSubId: state.activeSubId === curId ? newSubId : state.activeSubId
      };
    });
    return updatedScene;
  },

  saveSceneConnections: async (sceneSubId) => {
    const sId = sceneSubId ? sceneSubId.trim() : sceneSubId;
    const { scenesCache } = get();
    const scene = scenesCache[sId];
    if (!scene || !scene._id) {
      throw new Error("No hay datos del escenario o falta el ID del escenario");
    }

    try {
      const updatedScene = await updateScene(scene._id, {
        conexiones: scene.conexiones
      });
      // Mantener los eventos cacheados al actualizar la escena
      updatedScene.eventos = scene.eventos;
      set((state) => ({
        scenesCache: {
          ...state.scenesCache,
          [sId]: updatedScene
        }
      }));
      return updatedScene;
    } catch (error) {
      console.error("Error al guardar conexiones en la base de datos:", error);
      throw error;
    }
  }
}));