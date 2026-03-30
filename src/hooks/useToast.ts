import { useToastStore } from '@/store/toastStore';
import type { ToastVariant } from '@/components/ui';

/**
 * Hook personalizado para facilitar el uso de toasts/notificaciones
 * Proporciona métodos convenientes para diferentes tipos de notificaciones
 */
export const useToast = () => {
  const addToast = useToastStore((s) => s.addToast);

  return {
    /**
     * Mostrar toast de éxito
     */
    success: (message: string, duration?: number) => {
      addToast(message, 'success', duration);
    },

    /**
     * Mostrar toast de error
     */
    error: (message: string, duration?: number) => {
      addToast(message, 'error', duration);
    },

    /**
     * Mostrar toast de advertencia
     */
    warning: (message: string, duration?: number) => {
      addToast(message, 'warning', duration);
    },

    /**
     * Mostrar toast de información
     */
    info: (message: string, duration?: number) => {
      addToast(message, 'info', duration);
    },

    /**
     * Mostrar toast con tipo personalizado
     */
    show: (message: string, variant?: ToastVariant, duration?: number) => {
      addToast(message, variant, duration);
    }
  };
};
