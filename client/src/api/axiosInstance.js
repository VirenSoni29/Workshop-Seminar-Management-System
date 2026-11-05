import axios from 'axios';
import { tokenStore } from '../utils/tokenStore.js';

// Module-level copy so the interceptor never reads storage on every request.
let currentToken = tokenStore.get();

// AuthContext calls this on login/register/logout. Pass null to clear.
export const setAuthToken = (token) => {
   currentToken = token || null;
   if (token) tokenStore.set(token);
   else tokenStore.clear();
};

export const getAuthToken = () => currentToken;

const axiosInstance = axios.create({
   baseURL: import.meta.env.VITE_API_URL,
   timeout: 15000,
});

// Attach the Bearer token to every request
axiosInstance.interceptors.request.use((config) => {
   if (currentToken) config.headers.Authorization = `Bearer ${currentToken}`;
   return config;
});

// 401 -> clear token + go to /login
axiosInstance.interceptors.response.use(
   (response) => response,
   (error) => {
      const status = error.response?.status;
      const url = error.config?.url || '';
      const isAuthForm = url.includes('/auth/login') || url.includes('/auth/register');
      const skip = error.config?.skipAuthRedirect; // used by the AuthContext /me check

      if (status === 401 && !isAuthForm) {
         setAuthToken(null);
         if (!skip && window.location.pathname !== '/login') {
            window.location.assign('/login');
         }
      }
      return Promise.reject(error);
   }
);

export default axiosInstance;