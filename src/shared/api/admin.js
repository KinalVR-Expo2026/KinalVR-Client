import { axiosAdmin } from "./api";

export const getScenesList = async (params = {}) => {
  const mergedParams = { limite: 1000, ...params };
  const response = await axiosAdmin.get('/scenes', { params: mergedParams });
  return response.data.scenes || response.data;
};

export const createScene = async (data) => {
  const response = await axiosAdmin.post('/scenes', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data.scene;
};

export const getSceneBySubId = async (subId) => {
  const response = await axiosAdmin.get(`/scenes/sub/${subId}`);
  return response.data.scene; 
};

export const getSceneById = async (id) => {
  const response = await axiosAdmin.get(`/scenes/${id}`);
};

export const updateScene = async (id, data) => {
  const response = await axiosAdmin.put(`/scenes/${id}`, data);
  return response.data.scene;
};

export const updateEvent = async (id, data) => {
  const response = await axiosAdmin.put(`/events/${id}`, data);
  return response.data.event;
};

export const getEvents = async (params = {}) => {
  const response = await axiosAdmin.get('/events', { params });
  return response.data.events;
};

export const createEvent = async (data) => {
  const response = await axiosAdmin.post('/events', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
  });
  return response.data.event;
};

export const deleteEvent = async (id) => {
  const response = await axiosAdmin.delete(`/events/${id}`);
  return response.data;
};