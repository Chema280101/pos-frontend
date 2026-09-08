'use client';

import { AlertTriangle, X, ArrowLeft, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UnsavedChangesModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function UnsavedChangesModal({ 
  open, 
  onClose, 
  onConfirm, 
  onCancel 
}: UnsavedChangesModalProps): JSX.Element | null {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-200" 
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div 
        className={cn(
          'w-full max-w-md rounded-t-3xl sm:rounded-unit-lg border border-[var(--unit-border)]/60',
          'bg-[var(--unit-surface-elevated)] shadow-unit-lg p-6 sm:p-7 relative z-10 overflow-hidden',
          'animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200'
        )}
      >
        {/* Ambient Top Glow */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent pointer-events-none" />

        {/* Mobile handle */}
        <div className="pt-1 pb-3 flex justify-center sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-zinc-700" />
        </div>

        {/* Header */}
        <div className="relative mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-unit bg-gradient-to-br from-amber-500 to-yellow-600 text-white shadow-md shadow-amber-500/20 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading text-lg sm:text-xl font-bold text-[var(--unit-text)]">Cambios sin guardar</h3>
              <p className="text-xs text-[var(--unit-text-muted)]">Tienes modificaciones pendientes</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-unit border border-slate-200/80 dark:border-zinc-700/80 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 p-2 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all active:scale-95"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Message */}
        <div className="mb-6 p-4 rounded-unit border border-amber-500/30 bg-amber-500/10 text-sm leading-relaxed text-slate-800 dark:text-zinc-200 font-medium">
          ¿Estás seguro de que deseas salir? Todos los cambios realizados que no hayas guardado se perderán definitivamente.
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-unit border border-slate-200/80 dark:border-zinc-700/80 text-slate-700 dark:text-zinc-200 font-semibold bg-slate-100/90 hover:bg-slate-200/90 dark:bg-zinc-800/90 dark:hover:bg-zinc-700/90 transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4 text-[var(--unit-text-muted)]" />
            Seguir editando
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-unit text-white font-semibold shadow-unit shadow-red-500/20 border border-red-500/30 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Descartar
          </button>
        </div>
      </div>
    </div>
  );
}
