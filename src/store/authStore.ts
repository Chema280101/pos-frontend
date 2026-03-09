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
        
        // Reset flag after clearing
        setTimeout(() => {
          isClearingSession = false;
        }, 0);
      },

      setUser: (user) => set({ user }),

      logout: async () => {
        try {
          await api.post('/api/auth/logout');
        } finally {
          get().clearSession();
        }
      },

      fetchMe: async () => {
        const token = getAccessToken();
        if (!token) return null;

        try {
          const { data } = await api.get<AuthUser>('/api/auth/me');
          set({ user: data });
          return data;
        } catch {
          get().clearSession();
          return null;
        }
      },

      tryRefresh: async () => {
        if (refreshPromise) return refreshPromise;

        refreshPromise = (async () => {
          set({ isLoading: true });

          try {
            const { data } = await api.post<{ user: AuthUser; accessToken: string }>(
              '/api/auth/refresh',
              {},
              { withCredentials: true }
            );

            setAccessToken(data.accessToken);
            set({
              user: data.user,
              accessToken: data.accessToken,
              isLoading: false,
            });

            return true;
          } catch {
            setAccessToken(null);
            set({
              user: null,
              accessToken: null,
              isLoading: false,
            });

            return false;
          } finally {
            refreshPromise = null;
          }
        })();

        return refreshPromise;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
    }
  )
);