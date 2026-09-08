'use client';

import { useState, useEffect, useCallback } from 'react';
import { DollarSign, X, ArrowUpRight, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

export interface CashEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: string;
  userId: string | undefined;
  onSuccess?: () => void;
}

export function CashEntryModal({ isOpen, onClose, unit, userId, onSuccess }: CashEntryModalProps): JSX.Element | null {
  const { success, error } = useToast();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [type, setType] = useState('CASH_ENTRY');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setReason('');
      setType('CASH_ENTRY');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSubmit = useCallback(async () => {
    const parsedAmount = Number(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      error('El monto debe ser mayor a 0');
      return;
    }

    if (!reason.trim()) {
      error('El motivo es obligatorio');
      return;
    }

    if (!userId) {
      error('Usuario no autenticado');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/income', {
        amount: parsedAmount,
        reason: reason.trim(),
        type: type,
        unit: unit,
        enteredBy: userId,
      });

      success('Ingreso registrado correctamente');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err.message || 'Error al registrar ingreso';
      error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [amount, reason, type, unit, userId, error, success, onClose, onSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-200" 
        onClick={onClose} 
      />

      {/* Modal Card */}
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-unit-lg border border-[var(--unit-border)]/60 bg-[var(--unit-surface-elevated)] shadow-unit-lg p-6 sm:p-7 relative z-10 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Ambient Top Glow */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent pointer-events-none" />

        {/* Mobile handle */}
        <div className="pt-1 pb-3 flex justify-center sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-[var(--unit-border)]" />
        </div>

        {/* Header */}
        <div className="relative mb-5 flex items-start justify-between gap-4 border-b border-[var(--unit-border)]/30 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-unit bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-unit shadow-emerald-500/20 shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading text-lg sm:text-xl font-bold text-[var(--unit-text)]">Ingresar Efectivo</h3>
              <p className="text-xs sm:text-sm text-[var(--unit-text-muted)]">Entrada manual de dinero a la caja</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-unit border border-[var(--unit-border)]/60/80 dark:border-zinc-700/80 bg-[var(--unit-surface)]/50 hover:bg-[var(--unit-surface-elevated)] p-2 text-[var(--unit-text-muted)] hover:text-[var(--unit-text)] transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/40 active:scale-95"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Content */}
        <div className="space-y-4">
          {/* Monto */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--unit-text)]">
              Monto (S/) <span className="text-emerald-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[var(--unit-text-muted)]">
                S/
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-unit border border-[var(--unit-border)]/60 bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface-elevated)] focus:bg-[var(--unit-surface-elevated)]/70 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800 pl-11 pr-4 py-2.5 text-sm text-[var(--unit-text)] font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
              />
            </div>
          </div>

          {/* Tipo */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--unit-text)]">
              Tipo de Ingreso
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-unit border border-[var(--unit-border)]/60 px-3.5 py-2.5 text-sm text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface-elevated)] focus:bg-[var(--unit-surface-elevated)]/70 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="CASH_ENTRY">Ingreso de efectivo</option>
              <option value="TRANSFER_ENTRY">Transferencia</option>
              <option value="OTHER_ENTRY">Otro ingreso</option>
            </select>
          </div>

          {/* Motivo */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--unit-text)]">
              Motivo o Justificación <span className="text-emerald-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Aporte inicial adicional, pago directo, etc."
              rows={3}
              className="w-full rounded-unit border border-[var(--unit-border)]/60 px-4 py-2.5 text-sm text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface-elevated)] focus:bg-[var(--unit-surface-elevated)]/70 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-unit border border-[var(--unit-border)]/60/80 dark:border-zinc-700/80 px-4 py-2.5 text-sm font-semibold text-[var(--unit-text)] dark:text-zinc-200 bg-slate-100/90 hover:bg-slate-200/90 dark:bg-zinc-800/90 dark:hover:bg-zinc-700/90 transition-all active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !amount || !reason.trim()}
              className={cn(
                'flex-1 rounded-unit px-4 py-2.5 text-sm font-bold text-white shadow-unit shadow-emerald-500/20 border border-emerald-500/30 transition-all',
                'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700',
                'active:scale-[0.98]',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2'
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <ArrowUpRight className="h-4 w-4" />
                  Ingresar efectivo
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
