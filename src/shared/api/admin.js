import { axiosAdmin } from "./api";

export const getSceneBySubId = async (subId) => {
  const response = await axiosAdmin.get(`/scenes/sub/${subId}`);
  return response.data.scene; 
};

export const getSceneById = async (id) => {
  const response = await axiosAdmin.get(`/scenes/${id}`);
}
export const updateScene = async (id, data) => {
  const response = await axiosAdmin.put(`/scenes/${id}`, data);
  return response.data.scene;
};

export const updateEvent = async (id, data) => {
  const response = await axiosAdmin.put(`/events/${id}`, data);
  return response.data.event;
};