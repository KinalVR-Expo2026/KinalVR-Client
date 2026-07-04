import { create } from 'zustand';
import { getSceneBySubId, updateScene } from '../../../shared/api/admin';
import { getHighResTextureUrl, getLowResTextureUrl, preloadImage } from '../../../shared/utils/imageUtils';

const API_BASE_URL = import.meta.env.VITE_ADMIN_URL;

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
            preloadedImages: [...new Set([...state.preloadedImages, lowResUrl, highResUrl])]
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

    conexiones.forEach(async (conexion) => {
      const targetId = conexion.targetSubId;

      const sceneData = await fetchSceneData(targetId);

      if (sceneData && sceneData.urlImagen) {
        const lowResUrl = getLowResTextureUrl(sceneData.urlImagen);
        const highResUrl = getHighResTextureUrl(sceneData.urlImagen);
        
        preloadImage(lowResUrl).catch(() => { });
        preloadImage(highResUrl).catch(() => { });
        
        set((state) => ({
          preloadedImages: [...new Set([...state.preloadedImages, lowResUrl, highResUrl])]
        }));
      }
    });
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
        position: '0 0 -2',
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
  },

  addEventToSceneCache: (sceneSubId, event) => {
    const sId = sceneSubId ? sceneSubId.trim() : sceneSubId;
    set((state) => {
      const scene = state.scenesCache[sId];
      if (!scene) return state;
      const updatedEvents = [...(scene.eventos || []), event];
      return {
        scenesCache: {
          ...state.scenesCache,
          [sId]: { ...scene, eventos: updatedEvents }
        }
      };
    });
  },

  removeEventFromSceneCache: (sceneSubId, eventId) => {
    const sId = sceneSubId ? sceneSubId.trim() : sceneSubId;
    set((state) => {
      const scene = state.scenesCache[sId];
      if (!scene) return state;
      const updatedEvents = (scene.eventos || []).filter(e => (e._id || e.id) !== eventId);
      return {
        scenesCache: {
          ...state.scenesCache,
          [sId]: { ...scene, eventos: updatedEvents }
        }
      };
    });
  },

  updateEventInSceneCache: (sceneSubId, eventId, updatedFields) => {
    const sId = sceneSubId ? sceneSubId.trim() : sceneSubId;
    set((state) => {
      const scene = state.scenesCache[sId];
      if (!scene) return {};
      const updatedEventos = (scene.eventos || []).map((e) => {
        if ((e._id || e.id) === eventId) {
          return { ...e, ...updatedFields };
        }
        return e;
      });
      return {
        scenesCache: {
          ...state.scenesCache,
          [sId]: { ...scene, eventos: updatedEventos }
        }
      };
    });
  }
}));