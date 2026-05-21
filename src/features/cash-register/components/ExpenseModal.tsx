'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingDown, X, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  registerId: string;
  onSuccess?: () => void;
}

export function ExpenseModal({ isOpen, onClose, registerId, onSuccess }: ExpenseModalProps): JSX.Element | null {
  const { success, error } = useToast();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState('Otros');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setReason('');
      setCategory('Otros');
      setPaymentMethod('CASH');
    }
  }, [isOpen]);

  // Handle ESC key to close modal
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

    setLoading(true);

    try {
      const { data: result } = await api.post(
        `/api/cash-register/${registerId}/expense`,
        {
          amount: parsedAmount,
          reason: reason.trim(),
          category: category,
          paymentMethod: paymentMethod,
        }
      );

      success('Egreso registrado correctamente');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err.message || 'Error al registrar egreso';
      error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [amount, reason, category, paymentMethod, registerId, error, success, onClose, onSuccess]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative overflow-hidden rounded-2xl border-2 border-red-500/30 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div
            className="h-full w-full bg-repeat"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ef4444' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Header - Estándar consistente */}
        <div className="relative mb-6 flex items-start justify-between gap-4 px-6 pt-6">
          {/* Background gradient for header */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
              <TrendingDown className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--unit-text)]">Registrar Gasto</h3>
              <p className="text-sm text-[var(--unit-text-muted)]">Registra un egreso de caja</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="relative z-10 shrink-0 rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)]/50 p-2 text-[var(--unit-text-muted)] transition-all duration-200 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="relative px-6 pb-6 space-y-5">
          {/* Monto */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">
              Monto (S/) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-[var(--unit-text-muted)] font-bold">S/</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 pl-12 pr-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all placeholder:text-[var(--unit-text-muted)]/50"
              />
            </div>
          </div>

          {/* Categoría */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                backgroundSize: '1.5rem',
              }}
            >
              <option value="Otros">Otros</option>
              <option value="Insumos">Insumos</option>
              <option value="Servicios">Servicios</option>
              <option value="Mantenimiento">Mantenimiento</option>
              <option value="Alquiler">Alquiler</option>
              <option value="Servicios básicos">Servicios básicos</option>
              <option value="Marketing">Marketing</option>
              <option value="Oficina">Oficina</option>
            </select>
          </div>

          {/* Método de Pago */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">
              Método de Pago
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                backgroundSize: '1.5rem',
              }}
            >
              <option value="CASH">Efectivo</option>
              <option value="CARD">Tarjeta</option>
              <option value="TRANSFER">Transferencia</option>
              <option value="DIGITAL_WALLET">Billetera Digital</option>
            </select>
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">
              Motivo <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Compra de insumos, pago de servicios, etc."
              rows={3}
              className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all placeholder:text-[var(--unit-text-muted)]/50 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm font-medium text-[var(--unit-text)] bg-[var(--unit-surface)] hover:bg-[var(--unit-surface-elevated)] transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !amount || !reason.trim()}
              className={cn(
                'flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg border-2 transition-all',
                'bg-gradient-to-r from-red-500 to-red-600 border-red-500/50',
                'hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:hover:shadow-none'
              )}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Registrando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Registrar gasto
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
