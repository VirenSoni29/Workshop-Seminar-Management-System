import axiosInstance from './axiosInstance';

export const registerForWorkshopApi = (workshopId) =>
   axiosInstance.post(`/registrations/workshops/${workshopId}/register`);
export const cancelRegistrationApi = (id) => axiosInstance.delete(`/registrations/${id}`);
export const getMyRegistrationsApi = () => axiosInstance.get('/registrations/my');
export const getRegistrationQrApi = (id) => axiosInstance.get(`/registrations/${id}/qr`);

// workshop owner / admin
export const getWorkshopAttendeesApi = (workshopId, params) =>
   axiosInstance.get(`/registrations/workshops/${workshopId}`, { params });