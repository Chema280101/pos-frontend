'use client';

import { AlertTriangle, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title,
  message,
  type = 'danger',
  confirmText = type === 'danger' ? 'Confirmar eliminación' : 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false,
}: ConfirmDialogProps): JSX.Element {
  if (!isOpen) return <></>;

  const typeConfig = {
    danger: {
      icon: AlertTriangle,
      bgColor: 'from-red-50 to-red-100',
      borderColor: 'border-red-200/50',
      iconColor: 'text-red-600',
      buttonBg: 'from-red-600 to-red-700',
      buttonHover: 'hover:from-red-700 hover:to-red-800',
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'from-amber-50 to-amber-100',
      borderColor: 'border-amber-200/50',
      iconColor: 'text-amber-600',
      buttonBg: 'from-amber-600 to-amber-700',
      buttonHover: 'hover:from-amber-700 hover:to-amber-800',
    },
    info: {
      icon: Info,
      bgColor: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-200/50',
      iconColor: 'text-blue-600',
      buttonBg: 'from-blue-600 to-blue-700',
      buttonHover: 'hover:from-blue-700 hover:to-blue-800',
    },
    success: {
      icon: CheckCircle,
      bgColor: 'from-emerald-50 to-emerald-100',
      borderColor: 'border-emerald-200/50',
      iconColor: 'text-emerald-600',
      buttonBg: 'from-emerald-600 to-emerald-700',
      buttonHover: 'hover:from-emerald-700 hover:to-emerald-800',
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      <div className={cn(
        'w-full max-w-md rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6 relative overflow-hidden',
        config.borderColor
      )}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='20' cy='20' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>

        {/* Header */}
        <div className="relative mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl shadow-lg',
                `bg-gradient-to-br ${config.buttonBg}`
              )}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--unit-text)]">{title}</h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="relative z-10 shrink-0 rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)]/50 p-2 text-[var(--unit-text-muted)] transition-all duration-200 hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10 hover:text-[var(--unit-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={cn(
          'relative mb-6 p-4 rounded-xl border-2',
          config.borderColor,
          `bg-gradient-to-br ${config.bgColor}`
        )}>
          <p className="text-sm text-[var(--unit-text)] leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="relative flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-6 py-3 rounded-xl border-2 border-[var(--unit-accent)]/50 text-[var(--unit-accent)] font-bold bg-[var(--unit-surface)] hover:bg-[var(--unit-accent)] hover:text-white transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'flex-1 px-6 py-3 rounded-xl text-white font-bold shadow-lg border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100',
              `bg-gradient-to-r ${config.buttonBg} ${config.buttonHover}`
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Procesando...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
