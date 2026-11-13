import axiosInstance from './axiosInstance';

// GET /activity?page&limit&action&entityType -> { data: [...], meta }
export const getActivityApi = (params) => axiosInstance.get('/activity', { params });