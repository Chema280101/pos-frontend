'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Input, Modal, Select } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { DollarSign, CheckCircle, Loader2 } from 'lucide-react';

export interface LiquidationFormProps {
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
  const { success, error } = useToast();
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentNotes, setPaymentNotes] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/api/commissions/${commissionId}/paid`, {
        paymentMethod: paymentMethod.trim() || undefined,
        paymentNotes: paymentNotes.trim() || undefined,
      });
    },
    onSuccess: () => {
      success('Comisión marcada como pagada correctamente');
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      setPaymentMethod('CASH');
      setPaymentNotes('');
      onClose();
    },
    onError: () => {
      error('Error al liquidar comisión');
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Liquidar Comisión"
      description="Registrar pago formal al especialista"
      headerIcon={<DollarSign className="h-5 w-5" />}
      size="sm"
    >
      <div className="space-y-4">
        {/* Detail summary box */}
        <div className="rounded-unit border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--unit-text-muted)] uppercase tracking-wider">Especialista</span>
            <span className="font-bold text-[var(--unit-text)] truncate max-w-[180px]">{employeeName}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-[var(--unit-text-muted)] uppercase tracking-wider text-xs">Monto a Pagar</span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              S/ {amount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-3">
          <Select
            label="Método de Pago"
            required
            value={paymentMethod}
            onChange={(e: any) => setPaymentMethod(e.target.value)}
            options={[
              { value: 'CASH', label: 'Efectivo' },
              { value: 'TRANSFER', label: 'Transferencia Bancaria' },
              { value: 'DIGITAL_WALLET', label: 'Billetera Digital (Yape / Plin)' }
            ]}
          />

          <Input
            label="Notas / Referencia (Opcional)"
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            placeholder="Ej: Pago quincenal, nro. de operación..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="flex-1 px-4 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-sm font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-border)]/20 transition-all active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !paymentMethod}
            className="flex-1 px-4 py-2.5 rounded-unit bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-unit shadow-emerald-500/20 border border-emerald-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Liquidando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Confirmar Pago
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}