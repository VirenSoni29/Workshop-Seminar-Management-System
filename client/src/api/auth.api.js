import axiosInstance from './axiosInstance';

export const registerApi = (payload) => axiosInstance.post('/auth/register', payload);
export const loginApi = (payload) => axiosInstance.post('/auth/login', payload);

// skipAuthRedirect: an expired token on page load must not bounce visitors off public pages
export const getMeApi = () => axiosInstance.get('/auth/me', { skipAuthRedirect: true });