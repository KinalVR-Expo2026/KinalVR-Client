import { axiosAdmin } from "./api";

export const getSceneBySubId = async (subId) => {
  const response = await axiosAdmin.get(`/scenes/sub/${subId}`);
  return response.data.scene; 
};

export const getSceneById = async (id) => {
  const response = await axiosAdmin.get(`/scenes/${id}`);
  return response.data.scene;
};