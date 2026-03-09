import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';

// En el navegador apuntar directo al backend para evitar recursión del proxy Next.js
const baseURL =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000')
    : process.env.NEXT_PUBLIC_API_URL ?? '';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken: string | null = null;
let onTokenUpdate: ((token: string | null) => void) | null = null;

// Initialize token from localStorage on module load
if (typeof window !== 'undefined') {
  accessToken = localStorage.getItem('accessToken');
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  // Also save to localStorage for persistence
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }
  onTokenUpdate?.(token);
}

export function getAccessToken(): string | null {
  // First try the in-memory variable, fallback to localStorage
  if (accessToken) return accessToken;
  
  if (typeof window !== 'undefined') {
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      accessToken = storedToken; // Update in-memory variable
      return storedToken;
    }
  }
  
  return null;
}

export function setOnTokenUpdate(cb: (token: string | null) => void): void {
  onTokenUpdate = cb;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (err: AxiosError) => {
    const original = err.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!err.response || err.response.status !== 401 || !original) {
      return Promise.reject(err);
    }

    if (
      original.url?.includes('/api/auth/refresh') ||
      original.url?.includes('/api/auth/login')
    ) {
      return Promise.reject(err);
    }

    if (original._retry) {
      return Promise.reject(err);
    }

    original._retry = true;

    try {
      const success = await useAuthStore.getState().tryRefresh();

      if (!success) {
        return Promise.reject(err);
      }

      const newToken = getAccessToken();

      if (newToken && original.headers) {
        original.headers.Authorization = `Bearer ${newToken}`;
      }

      return api(original);
    } catch {
      useAuthStore.getState().clearSession();
      return Promise.reject(err);
    }
  }
);
