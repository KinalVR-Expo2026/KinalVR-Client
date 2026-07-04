import { axiosAdmin } from './api';

export const getScenes = async () => {
  const response = await axiosAdmin.get('/scenes', { params: { limite: 1000 } });
  return response.data.scenes;
};

export const updateScenePosition = async (payload) => {
  const response = await axiosAdmin.post('/scenes/posicion-nivel', payload);
  return response.data.scene;
};
