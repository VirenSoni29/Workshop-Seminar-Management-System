import axiosInstance from './axiosInstance';

export const getMyCertificatesApi = () => axiosInstance.get('/certificates/my');
export const generateCertificatesApi = (workshopId) =>
   axiosInstance.post(`/certificates/workshops/${workshopId}/generate`);
export const verifyCertificateApi = (certificateId) =>
   axiosInstance.get(`/certificates/verify/${certificateId}`);
// The PDF download goes through utils/downloadBlob: downloadBlob(`/certificates/${id}/download`)