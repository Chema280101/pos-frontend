'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api, setAccessToken, getAccessToken, setOnTokenUpdate } from '@/lib/api';
import type { AuthUser } from '@/types/auth';
import { useUnitStore } from './unitStore';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isHydrated: boolean;
  setSession: (user: AuthUser, token: string) => void;
  clearSession: () => void;
  setUser: (user: AuthUser | null) => void;
  setHydrated: (v: boolean) => void;
  logout: () => Promise<void>;
  fetchMe: () => Promise<AuthUser | null>;
  tryRefresh: () => Promise<boolean>;
}

let refreshPromise: Promise<boolean> | null = null;
let isClearingSession = false; // Flag to prevent infinite loop

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      isHydrated: false,

      setHydrated: (v) => set({ isHydrated: v }),

      setSession: (user, token) => {
        setAccessToken(token); 
        const currentUnit = useUnitStore.getState().activeUnit;
        if (user.role === 'ADMIN') {
          if (!currentUnit) useUnitStore.getState().setUnit(user.unit ?? 'SPA');
        } else {
          useUnitStore.getState().setUnit(user.unit);
        }
        set({ user, accessToken: token });
      },

      clearSession: () => {
        // Evitar bucle infinito
        if (isClearingSession) return;
        isClearingSession = true;
        
        // Limpiar callback para evitar bucle
        setOnTokenUpdate(() => {}); // Fix type error by using a proper callback function
        setAccessToken(null); 
        useUnitStore.getState().setUnit(null);
        set({ user: null, accessToken: null });
        
        // ✅ NUEVO: Limpiar cache de React Query para evitar filtración entre sesiones
        if (typeof window !== 'undefined' && window.queryClient) {
          try {
            // Limpiar todas las queries cacheadas
            window.queryClient.clear();
            // React Query cache cleared on logout
          } catch (error) {
            // Error clearing React Query cache
          }
        }
        
        // Reset flag after clearing
        setTimeout(() => {
          isClearingSession = false;
        }, 0);
      },

      setUser: (user) => set({ user }),

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          // Logout error
        } finally {
          get().clearSession();
        }
      },

      fetchMe: async () => {
        try {
          const response = await api.get('/auth/me');
          const userData = response.data;
          get().setSession(userData, getAccessToken()!);
          return userData;
        } catch (error) {
          // fetchMe error
          get().clearSession();
          return null;
        }
      },

      tryRefresh: async () => {
        if (refreshPromise) {
          return refreshPromise;
        }

        refreshPromise = (async () => {
          try {
            const response = await api.post('/api/auth/refresh');
            const { accessToken: newToken } = response.data;
            setAccessToken(newToken);
            set({ accessToken: newToken });
            return true;
          } catch (error) {
            // Token refresh failed
            get().clearSession();
            return false;
          } finally {
            refreshPromise = null;
          }
        })();

        return refreshPromise;
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        if (state?.accessToken) {
          setAccessToken(state.accessToken);
        }
      },
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
    }
  )
);