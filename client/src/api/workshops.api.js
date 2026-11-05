import axiosInstance from './axiosInstance';

export const getWorkshopsApi = (params) => axiosInstance.get('/workshops', { params });
export const getMyWorkshopsApi = (params) => axiosInstance.get('/workshops/my', { params });
export const getWorkshopApi = (id) => axiosInstance.get(`/workshops/${id}`);

export const createWorkshopApi = (payload) => axiosInstance.post('/workshops', payload);
export const updateWorkshopApi = (id, payload) => axiosInstance.put(`/workshops/${id}`, payload);
export const deleteWorkshopApi = (id) => axiosInstance.delete(`/workshops/${id}`);

export const submitWorkshopApi = (id) => axiosInstance.patch(`/workshops/${id}/submit`);
export const approveWorkshopApi = (id, remarks) => axiosInstance.patch(`/workshops/${id}/approve`, { remarks });
export const rejectWorkshopApi = (id, remarks) => axiosInstance.patch(`/workshops/${id}/reject`, { remarks });
export const completeWorkshopApi = (id) => axiosInstance.patch(`/workshops/${id}/complete`);
export const cancelWorkshopApi = (id) => axiosInstance.patch(`/workshops/${id}/cancel`);