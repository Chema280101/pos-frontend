'use client';

import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { useUnitStore } from '@/store/unitStore';
import type { BusinessUnit } from '@/lib/theme';

interface Props {
  onSuccess?: () => void;
}

export function OpenRegisterForm({ onSuccess }: Props): JSX.Element {
  const activeUnit = useUnitStore((s) => s.activeUnit);

  const [unit, setUnit] = useState<BusinessUnit | ''>(activeUnit ?? '');
  const [openingAmount, setOpeningAmount] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const amount = Number(openingAmount);

    if (!unit) {
      alert('Selecciona una unidad');
      return;
    }

    if (isNaN(amount) || amount < 0) {
      alert('El monto inicial debe ser mayor o igual a 0');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/cash-register/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit,
          openingAmount: amount,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al abrir caja');
      }

      alert('Caja abierta correctamente');
      onSuccess?.();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-6 bg-[var(--unit-surface-elevated)] rounded-xl border border-[var(--unit-border)]">
      <h2 className="text-lg font-semibold">Apertura de Caja</h2>

      {/* Unidad */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Unidad</label>

        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as BusinessUnit)}
          className="w-full rounded-md border border-[var(--unit-border)] bg-[var(--unit-surface)] px-3 py-2 text-sm"
        >
          <option value="">Seleccionar unidad</option>
          <option value="SPA">SPA</option>
          <option value="BARBERIA">BARBERÍA</option>
        </select>
      </div>

      {/* Monto inicial */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Monto inicial (S/)</label>

        <Input
          type="number"
          min="0"
          step="0.01"
          value={openingAmount}
          onChange={(e) => setOpeningAmount(e.target.value)}
          placeholder="Ej: 200.00"
        />
      </div>

      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Abriendo...' : 'Abrir Caja'}
      </Button>
    </div>
  );
}