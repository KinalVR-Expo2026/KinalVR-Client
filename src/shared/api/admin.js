import { axiosAdmin } from "./api";

export const getSceneBySubId = async (subId) => {
  const response = await axiosAdmin.get(`/scenes/sub/${subId}`);
  return response.data.scene; 
};

export const updateScene = async (id, data) => {
  const response = await axiosAdmin.put(`/scenes/${id}`, data);
  return response.data.scene;
};