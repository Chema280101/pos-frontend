// 🎯 SISTEMA DE TOAST NOTIFICATIONS

import React from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

class ToastManager {
  private toasts: Toast[] = [];
  private listeners: ((toasts: Toast[]) => void)[] = [];

  // Suscribirse a cambios
  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notificar a todos los listeners
  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  // Agregar un toast
  add(type: ToastType, title: string, message?: string, options?: ToastOptions) {
    const toast: Toast = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      title,
      message,
      duration: options?.duration || this.getDefaultDuration(type),
      action: options?.action
    };

    this.toasts.push(toast);
    this.notify();

    // Auto remover después del duration
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        this.remove(toast.id);
      }, toast.duration);
    }

    return toast.id;
  }

  // Remover un toast
  remove(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notify();
  }

  // Limpiar todos los toasts
  clear() {
    this.toasts = [];
    this.notify();
  }

  // Duración por defecto según tipo
  private getDefaultDuration(type: ToastType): number {
    switch (type) {
      case 'success':
        return 4000;
      case 'error':
        return 8000;
      case 'warning':
        return 6000;
      case 'info':
        return 5000;
      default:
        return 5000;
    }
  }

  // Métodos convenientes
  success(title: string, message?: string, options?: ToastOptions) {
    return this.add('success', title, message, options);
  }

  error(title: string, message?: string, options?: ToastOptions) {
    return this.add('error', title, message, options);
  }

  warning(title: string, message?: string, options?: ToastOptions) {
    return this.add('warning', title, message, options);
  }

  info(title: string, message?: string, options?: ToastOptions) {
    return this.add('info', title, message, options);
  }

  // Obtener toasts actuales
  getToasts(): Toast[] {
    return [...this.toasts];
  }
}

// Instancia global
export const toastManager = new ToastManager();

// Hook para usar toasts en componentes
export const useToast = () => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  React.useEffect(() => {
    return toastManager.subscribe(setToasts);
  }, []);

  return {
    toasts,
    success: toastManager.success.bind(toastManager),
    error: toastManager.error.bind(toastManager),
    warning: toastManager.warning.bind(toastManager),
    info: toastManager.info.bind(toastManager),
    remove: toastManager.remove.bind(toastManager),
    clear: toastManager.clear.bind(toastManager)
  };
};

// Exportar para uso en la app
export { toastManager as toast };
export type { ToastType, Toast, ToastOptions };
