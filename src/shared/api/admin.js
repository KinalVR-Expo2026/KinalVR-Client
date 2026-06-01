import { axiosAdmin } from "./api";

export const getSceneBySubId = async (subId) => {
  const response = await axiosAdmin.get(`/scenes/sub/${subId}`);
  return response.data.scene; 
};