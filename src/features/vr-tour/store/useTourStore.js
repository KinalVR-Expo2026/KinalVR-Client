import { create } from 'zustand';
import { getSceneBySubId, updateScene } from '../../../shared/api/admin';
import { getHighResTextureUrl, preloadImage } from '../../../shared/utils/imageUtils';

export const useTourStore = create((set, get) => ({
  activeSubId: 'entrada',
  scenesCache: {},
  isAdminMode: false,
  selectedConnectionId: null,
  selectedEventId: null,

  setActiveSubId: (subId) => set({ activeSubId: subId ? subId.trim() : subId }),
  setAdminMode: (isAdmin) => set({ isAdminMode: isAdmin, selectedConnectionId: null, selectedEventId: null }),
  setSelectedConnectionId: (id) => set({ selectedConnectionId: id ? id.trim() : id, selectedEventId: null }),
  setSelectedEventId: (id) => set({ selectedEventId: id ? id.trim() : id, selectedConnectionId: null }),

  fetchSceneData: async (subId) => {
    const trimmedSubId = subId ? subId.trim() : subId;
    const { scenesCache } = get();
    if (scenesCache[trimmedSubId]) return scenesCache[trimmedSubId];

    try {
      const data = await getSceneBySubId(trimmedSubId);
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
        const textureUrl = getHighResTextureUrl(sceneData.urlImagen);
        preloadImage(textureUrl).catch(() => { });
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