import axiosInstance from "./axiosInstance";

export const getStatsApi = () => axiosInstance.get(`/stats`);