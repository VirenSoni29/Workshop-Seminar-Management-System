import axiosInstance from "./axiosInstance";

export const checkinApi = (uuid) => axiosInstance.post(`/checkin/scan`, { qrToken: uuid });
export const manualCheckinApi = (registrationId) => axiosInstance.patch(`/checkin/manual/${registrationId}`);