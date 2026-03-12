'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button, Input, Modal } from '@/components/ui';
import { useToastStore } from '@/store/toastStore';
import { DollarSign, CheckCircle } from 'lucide-react';

interface LiquidationFormProps {
  commissionId: string;
  employeeName: string;
  amount: number;
  open: boolean;
  onClose: () => void;
}

export function LiquidationForm({
  commissionId,
  employeeName,
  amount,
  open,
  onClose,
}: LiquidationFormProps): JSX.Element {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/api/commissions/${commissionId}/paid`, {
        paymentMethod: paymentMethod.trim() || undefined,
        paymentNotes: paymentNotes.trim() || undefined,
      });
    },
    onSuccess: () => {
      addToast('Comisión marcada como pagada', 'success');
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      setPaymentMethod('');
      setPaymentNotes('');
      onClose();
    },
    onError: () => {
      addToast('Error al liquidar comisión', 'error');
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title=""
      description=""
      size="sm"
    >
      <div className="relative">
        {/* Header - Estilo Eliminar Gasto */}
        <div className="relative flex items-center gap-4 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-emerald-900">Liquidar Comisión</h3>
            <p className="text-sm text-emerald-700">Registrar pago de comisión</p>
          </div>
        </div>

        {/* Content */}
        <div className="relative space-y-4">
          <div className="rounded-xl border-2 border-emerald-200/50 bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 shadow-lg mt-1">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-emerald-900">
                  ¿Estás seguro de que deseas liquidar S/ {amount.toFixed(2)} a {employeeName}?
                </p>
                <p className="text-sm text-emerald-700 mt-1">
                  Esta acción registrará el pago de la comisión y no se puede deshacer.
                </p>
              </div>
            </div>
          </div>

          {/* Commission Info */}
          <div className="rounded-xl border-2 border-emerald-200/30 bg-gradient-to-br from-white/50 to-white/30 p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Empleado</span>
                <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                  {employeeName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Monto</span>
                <span className="text-sm font-bold text-gray-900">
                  S/ {amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--unit-text)]">
              Método de pago
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-[var(--unit-border-radius)] border bg-[var(--unit-surface)] px-3 py-2 text-sm text-[var(--unit-text)]"
              style={{ borderColor: 'var(--unit-border)' }}
            >
              <option value="">Seleccionar...</option>
              <option value="CASH">Efectivo</option>
              <option value="TRANSFER">Transferencia</option>
              <option value="DIGITAL_WALLET">Billetera digital</option>
            </select>
          </div>
          <Input
            label="Notas (opcional)"
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            placeholder="Referencia, observaciones..."
          />
        </div>

        {/* Actions - Estilo Eliminar Gasto */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            className="flex-1 rounded-xl border-2 border-emerald-300/50 px-6 py-3 text-sm font-medium text-emerald-700 bg-white/80 hover:bg-emerald-50 transition-all hover:shadow-lg active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !paymentMethod}
            className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold shadow-lg border-2 border-emerald-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          >
            {mutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                Liquidando...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <DollarSign className="h-4 w-4" />
                Liquidar Comisión
              </span>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}