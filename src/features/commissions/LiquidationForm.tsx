'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button, Input, Modal } from '@/components/ui';
import { useToastStore } from '@/store/toastStore';

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
      title="Liquidar Comisión"
      description={`Pagar S/ ${amount.toFixed(2)} a ${employeeName}`}
      size="sm"
    >
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
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={() => mutation.mutate()}
            isLoading={mutation.isPending}
            disabled={!paymentMethod}
          >
            Confirmar pago
          </Button>
        </div>
      </div>
    </Modal>
  );
}