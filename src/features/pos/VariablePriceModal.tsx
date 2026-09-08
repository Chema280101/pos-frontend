'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { X, DollarSign, AlertTriangle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import type { ServiceOption, PriceValidation } from '@/types/pos';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

export interface VariablePriceModalProps {
  service: ServiceOption;
  isOpen: boolean;
  onClose: () => void;
  onPriceConfirm: (price: number) => void;
  onApprovalRequest?: (approvalData: { serviceId: string; requestedPrice: number; reason: string }) => void;
}

export function VariablePriceModal({
  service,
  isOpen,
  onClose,
  onPriceConfirm,
  onApprovalRequest,
}: VariablePriceModalProps): JSX.Element | null {
  const [customPrice, setCustomPrice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [validation, setValidation] = useState<PriceValidation | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const { user } = useAuthStore();

  if (!isOpen) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(value);
  };

  const handlePriceChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, '');
    setCustomPrice(cleanValue);
    setValidation(null);
  };

  const validatePrice = async () => {
    const price = parseFloat(customPrice);
    if (!price || price <= 0) {
      setValidation({
        valid: false,
        requiresApproval: false,
        canProceed: false,
        message: 'Por favor ingresa un precio válido',
      });
      return;
    }

    if (!user) {
      setValidation({
        valid: false,
        requiresApproval: false,
        canProceed: false,
        message: 'Debes iniciar sesión para validar precios',
      });
      return;
    }

    setIsValidating(true);
    try {
      const response = await api.post('/api/prices/validate', {
        serviceId: service.id,
        requestedPrice: price,
      });

      setValidation(response.data.validation);
    } catch (error: any) {
      if (error.response?.status === 401) {
        setValidation({
          valid: false,
          requiresApproval: false,
          canProceed: false,
          message: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
        });
      } else if (error.response?.status === 403) {
        setValidation({
          valid: false,
          requiresApproval: false,
          canProceed: false,
          message: 'No tienes permisos para validar precios.',
        });
      } else if (error.response?.data?.error) {
        setValidation({
          valid: false,
          requiresApproval: false,
          canProceed: false,
          message: error.response.data.error,
        });
      } else {
        setValidation({
          valid: false,
          requiresApproval: false,
          canProceed: false,
          message: 'Error al validar el precio. Intenta nuevamente.',
        });
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async () => {
    const price = parseFloat(customPrice);
    if (!price || price <= 0) return;

    setIsLoading(true);
    try {
      if (validation?.requiresApproval && validation.approvalData) {
        await onApprovalRequest?.(validation.approvalData);
        onClose();
        setCustomPrice('');
        setValidation(null);
      } else {
        onPriceConfirm(price);
        onClose();
        setCustomPrice('');
        setValidation(null);
      }
    } catch (error) {
      // Error handled by caller
    } finally {
      setIsLoading(false);
    }
  };

  const getPriceTypeColor = () => {
    switch (service.priceType) {
      case 'VARIABLE':
        return 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'RANGE':
        return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'QUOTE':
        return 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/30';
      default:
        return 'text-[var(--unit-text-muted)] bg-[var(--unit-surface-elevated)] border-[var(--unit-border)]';
    }
  };

  const getPriceTypeLabel = () => {
    switch (service.priceType) {
      case 'VARIABLE':
        return 'Precio Variable';
      case 'RANGE':
        return 'Precio con Aprobación';
      case 'QUOTE':
        return 'Precio por Cotización';
      default:
        return 'Precio Fijo';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-200" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-unit-lg border border-[var(--unit-border)]/60 bg-[var(--unit-surface-elevated)] shadow-unit-lg p-6 sm:p-7 relative z-10 overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Ambient Top Glow */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[var(--unit-accent)]/40 to-transparent pointer-events-none" />

        {/* Mobile handle */}
        <div className="pt-1 pb-3 flex justify-center sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-[var(--unit-border)]" />
        </div>

        {/* Header */}
        <div className="relative mb-5 flex items-start justify-between gap-4 border-b border-[var(--unit-border)]/30 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-unit bg-[var(--unit-accent)] text-white shadow-unit shadow-[var(--unit-accent)]/20 shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading text-lg sm:text-xl font-bold text-[var(--unit-text)]">Precio Personalizado</h3>
              <p className="text-xs sm:text-sm text-[var(--unit-text-muted)] line-clamp-1">{service.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-unit border border-[var(--unit-border)]/60/80 dark:border-zinc-700/80 bg-[var(--unit-surface)]/50 hover:bg-[var(--unit-surface-elevated)] p-2 text-[var(--unit-text-muted)] hover:text-[var(--unit-text)] transition-all active:scale-95"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Price Type Badge */}
          <div className="flex items-center justify-center">
            <span className={cn('inline-flex items-center px-3 py-1 text-xs font-bold rounded-full border', getPriceTypeColor())}>
              {getPriceTypeLabel()}
            </span>
          </div>

          {/* Price Range Info */}
          {service.minPrice && service.maxPrice && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-unit p-3.5">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Rango de precio permitido:</span>
              </div>
              <div className="mt-1 text-base font-bold text-[var(--unit-text)] tabular-nums">
                {formatCurrency(service.minPrice)} - {formatCurrency(service.maxPrice)}
              </div>
            </div>
          )}

          {/* Price Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--unit-text)]">
              Precio a cobrar (S/)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[var(--unit-text-muted)]">
                S/
              </span>
              <input
                type="text"
                value={customPrice}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="0.00"
                className="w-full pl-11 pr-4 py-2.5 rounded-unit border border-[var(--unit-border)]/60 bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface-elevated)] focus:bg-[var(--unit-surface-elevated)]/70 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800 text-lg font-bold text-[var(--unit-text)] tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/40 focus:border-[var(--unit-accent)] transition-all"
              />
            </div>
          </div>

          {/* Validation Result */}
          {validation && (
            <div
              className={cn(
                'rounded-unit p-3.5 border text-xs font-medium flex items-center gap-2',
                validation.valid
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : validation.requiresApproval
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
              )}
            >
              {validation.valid ? (
                <CheckCircle className="h-4 w-4 shrink-0" />
              ) : validation.requiresApproval ? (
                <Clock className="h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0" />
              )}
              <span>{validation.message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-unit border border-[var(--unit-border)]/60/80 dark:border-zinc-700/80 text-[var(--unit-text)] dark:text-zinc-200 font-semibold bg-slate-100/90 hover:bg-slate-200/90 dark:bg-zinc-800/90 dark:hover:bg-zinc-700/90 transition-all active:scale-[0.98] text-sm"
            >
              Cancelar
            </button>

            {!validation ? (
              <button
                type="button"
                onClick={validatePrice}
                disabled={!customPrice || isValidating}
                className="flex-1 px-4 py-2.5 rounded-unit bg-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/90 text-white font-semibold shadow-unit shadow-[var(--unit-accent)]/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Validando...
                  </>
                ) : (
                  'Validar Precio'
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!validation.canProceed || isLoading}
                className={cn(
                  'flex-1 px-4 py-2.5 rounded-unit font-semibold shadow-unit border transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2 text-white',
                  validation.requiresApproval
                    ? 'bg-amber-600 hover:bg-amber-700 border-amber-500/30 shadow-amber-500/20'
                    : 'bg-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/90 border-[var(--unit-accent)]/30 shadow-[var(--unit-accent)]/20'
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : validation.requiresApproval ? (
                  'Solicitar Aprobación'
                ) : (
                  'Confirmar Precio'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
