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

// Función para crear errores amigables
function createFriendlyError(error: AxiosError): Error {
  // Errores de red/conexión
  if (!error.response) {
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
      return new Error('Error de conexión. Por favor intenta de nuevo.');
    }
    if (error.code === 'ETIMEDOUT') {
      return new Error('La conexión tardó demasiado tiempo. Por favor intenta de nuevo.');
    }
    return new Error('Error de conexión. Por favor verifica tu internet e intenta de nuevo.');
  }

  // Errores HTTP específicos
  const status = error.response.status;
  switch (status) {
    case 400:
      return new Error('La solicitud no es válida. Por favor verifica los datos e intenta de nuevo.');
    case 401:
      return new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
    case 403:
      return new Error('No tienes permisos para realizar esta acción.');
    case 404:
      return new Error('El recurso solicitado no fue encontrado.');
    case 429:
      return new Error('Demasiadas solicitudes. Por favor espera un momento e intenta de nuevo.');
    case 500:
      return new Error('Error interno del servidor. Por favor intenta de nuevo más tarde.');
    case 502:
    case 503:
    case 504:
      return new Error('El servidor no está disponible. Por favor intenta de nuevo en unos minutos.');
    default:
      return new Error('Ocurrió un error inesperado. Por favor intenta de nuevo.');
  }
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

    // Si no hay respuesta, es un error de red
    if (!err.response) {
      const friendlyError = createFriendlyError(err);
      return Promise.reject(friendlyError);
    }

    // Manejo de 401 (no autorizado)
    if (err.response.status === 401) {
      if (
        original.url?.includes('/api/auth/refresh') ||
        original.url?.includes('/api/auth/login')
      ) {
        const friendlyError = createFriendlyError(err);
        return Promise.reject(friendlyError);
      }

      if (original._retry) {
        const friendlyError = createFriendlyError(err);
        return Promise.reject(friendlyError);
      }

      original._retry = true;

      try {
        const success = await useAuthStore.getState().tryRefresh();

        if (!success) {
          const friendlyError = createFriendlyError(err);
          return Promise.reject(friendlyError);
        }

        const newToken = getAccessToken();

        if (newToken && original.headers) {
          original.headers.Authorization = `Bearer ${newToken}`;
        }

        return api(original);
      } catch {
        useAuthStore.getState().clearSession();
        const friendlyError = createFriendlyError(err);
        return Promise.reject(friendlyError);
      }
    }

    // Para otros errores HTTP, crear error amigable
    const friendlyError = createFriendlyError(err);
    return Promise.reject(friendlyError);
  }
);
