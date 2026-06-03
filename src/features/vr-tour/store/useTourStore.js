import { create } from 'zustand';
import { getSceneBySubId } from '../../../shared/api/admin';
import { getHighResTextureUrl, preloadImage } from '../../../shared/utils/imageUtils';

export const useTourStore = create((set, get) => ({
  activeSubId: 'entrada',
  scenesCache: {},

  setActiveSubId: (subId) => set({ activeSubId: subId }),

  fetchSceneData: async (subId) => {
    const { scenesCache } = get();
    if (scenesCache[subId]) return scenesCache[subId];

    try {
      const data = await getSceneBySubId(subId);
      set((state) => ({
        scenesCache: { ...state.scenesCache, [subId]: data }
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
  }
}));