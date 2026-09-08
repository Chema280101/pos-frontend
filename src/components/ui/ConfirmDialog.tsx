'use client';

import { AlertTriangle, X, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel?: () => void;
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
}: ConfirmDialogProps): JSX.Element | null {
  if (!isOpen) return null;

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose();
  };

  const typeConfig = {
    danger: {
      icon: AlertTriangle,
      badgeBg: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
      iconBoxBg: 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/25',
      buttonBg: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-unit shadow-red-600/20 border-red-500/30',
    },
    warning: {
      icon: AlertCircle,
      badgeBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      iconBoxBg: 'bg-gradient-to-br from-amber-500 to-yellow-600 shadow-amber-500/25',
      buttonBg: 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white shadow-unit shadow-amber-600/20 border-amber-500/30',
    },
    info: {
      icon: Info,
      badgeBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
      iconBoxBg: 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/25',
      buttonBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-unit shadow-blue-600/20 border-blue-500/30',
    },
    success: {
      icon: CheckCircle,
      badgeBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      iconBoxBg: 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25',
      buttonBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-unit shadow-emerald-600/20 border-emerald-500/30',
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-200" 
        onClick={handleCancel}
      />

      {/* Modal Dialog Card */}
      <div 
        className={cn(
          'w-full max-w-md rounded-t-3xl sm:rounded-unit-lg border border-[var(--unit-border)]/60',
          'bg-[var(--unit-surface-elevated)] shadow-unit-lg p-6 sm:p-7 relative z-10 overflow-hidden',
          'animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200'
        )}
      >
        {/* Ambient Top Glow */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[var(--unit-accent)]/30 to-transparent pointer-events-none" />

        {/* Mobile handle */}
        <div className="pt-1 pb-3 flex justify-center sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-zinc-700" />
        </div>

        {/* Header */}
        <div className="relative mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={cn('flex h-11 w-11 items-center justify-center rounded-unit text-white shadow-md shrink-0', config.iconBoxBg)}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading text-lg sm:text-xl font-bold text-[var(--unit-text)]">{title}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="shrink-0 rounded-unit border border-slate-200/80 dark:border-zinc-700/80 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 p-2 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all active:scale-95 disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Message Box */}
        <div className={cn('mb-6 p-4 rounded-unit border leading-relaxed text-sm', config.badgeBg)}>
          <p className="text-slate-800 dark:text-zinc-100 font-medium">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-unit border border-slate-200/80 dark:border-zinc-700/80 text-slate-700 dark:text-zinc-200 font-semibold bg-slate-100/80 hover:bg-slate-200/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'flex-1 px-4 py-2.5 rounded-unit font-semibold border transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm',
              config.buttonBg
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
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
