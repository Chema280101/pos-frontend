'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose: () => void;
}

const icons = { success: CheckCircle, error: AlertCircle, warning: AlertCircle, info: Info };
const styles: Record<ToastVariant, string> = {
  success: 'bg-green-100 border-green-200 text-green-800',
  error: 'bg-red-100 border-red-200 text-red-800',
  warning: 'bg-amber-100 border-amber-200 text-amber-800',
  info: 'bg-blue-100 border-blue-200 text-blue-800',
};

export function Toast({ message, variant = 'info', duration = 5000, onClose }: ToastProps): JSX.Element {
  const Icon = icons[variant];
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={cn(
        'flex items-center gap-3 rounded-[var(--unit-border-radius)] border px-4 py-3 shadow-unit',
        styles[variant]
      )}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded p-1 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]"
        aria-label="Cerrar notificación"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; variant?: ToastVariant; duration?: number }>;
  removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps): JSX.Element {
  return (
    <div className="fixed right-4 top-4 z-[100] flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            variant={t.variant}
            duration={t.duration}
            onClose={() => removeToast(t.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
