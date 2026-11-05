/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { getAuthToken, setAuthToken } from '../api/axiosInstance';
import { getMeApi, loginApi, registerApi } from '../api/auth.api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
   const [user, setUser] = useState(null);
   const [token, setToken] = useState(getAuthToken());
   const [ready, setReady] = useState(false); // false until the /me check finishes

   // Rehydrate on first load
   useEffect(() => {
      let cancelled = false;

      const rehydrate = async () => {
         if (!getAuthToken()) {
            setReady(true);
            return;
         }
         try {
            const res = await getMeApi();
            if (!cancelled) setUser(res.data.data.user);
         } catch {
            if (!cancelled) {
               setAuthToken(null);
               setToken(null);
               setUser(null);
            }
         } finally {
            if (!cancelled) setReady(true);
         }
      };

      rehydrate();
      return () => {
         cancelled = true;
      };
   }, []);

   const startSession = useCallback((data) => {
      setAuthToken(data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
   }, []);

   // Both throw on failure: the page catches and shows errors
   const login = useCallback(
      async (credentials) => {
         const res = await loginApi(credentials);
         return startSession(res.data.data);
      },
      [startSession]
   );

   const register = useCallback(
      async (payload) => {
         const res = await registerApi(payload);
         return startSession(res.data.data);
      },
      [startSession]
   );

   const logout = useCallback(() => {
      setAuthToken(null);
      setToken(null);
      setUser(null);
   }, []);

   const value = useMemo(
      () => ({ user, token, ready, isAuthenticated: !!user, login, register, logout }),
      [user, token, ready, login, register, logout]
   );

   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}