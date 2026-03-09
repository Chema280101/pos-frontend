'use client';

import { useState } from 'react';
import { Button, Input } from '@/components/ui';

interface Props {
  registerId: string;
  onSuccess?: () => void;
}

export function ExpenseForm({ registerId, onSuccess }: Props): JSX.Element {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const parsedAmount = Number(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }

    if (!reason.trim()) {
      alert('El motivo es obligatorio');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `/api/cash-register/${registerId}/expense`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: parsedAmount,
            reason: reason.trim(),
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al registrar egreso');
      }

      alert('Egreso registrado correctamente');

      setAmount('');
      setReason('');
      onSuccess?.();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-6 bg-[var(--unit-surface-elevated)] rounded-xl border border-[var(--unit-border)]">
      <h2 className="text-lg font-semibold">Registrar Egreso</h2>

      <div className="space-y-2">
        <label className="text-sm font-medium">Monto (S/)</label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Ej: 50.00"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Motivo</label>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej: Compra de agua, movilidad, etc."
        />
      </div>

      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Guardando...' : 'Registrar Egreso'}
      </Button>
    </div>
  );
}