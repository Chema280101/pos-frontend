'use client';

import { useState, useMemo } from 'react';
import { Button, Input } from '@/components/ui';

interface Props {
  registerId: string;
  closingExpected: number;
  onSuccess?: () => void;
}

const DENOMINATIONS = [
  200, 100, 50, 20, 10,
  5, 2, 1,
  0.5, 0.2, 0.1
];

export function CloseRegisterForm({
  registerId,
  closingExpected,
  onSuccess,
}: Props) {
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [signature, setSignature] = useState('');
  const [loading, setLoading] = useState(false);

  const totalDeclared = useMemo(() => {
    return DENOMINATIONS.reduce((acc, denom) => {
      const qty = quantities[denom] || 0;
      return acc + denom * qty;
    }, 0);
  }, [quantities]);

  const difference = totalDeclared - closingExpected;

  function handleChange(denom: number, value: string) {
    const qty = Number(value);
    setQuantities((prev) => ({
      ...prev,
      [denom]: isNaN(qty) ? 0 : qty,
    }));
  }

  async function handleSubmit() {
    if (!signature.trim()) {
      alert('La firma es obligatoria');
      return;
    }

    setLoading(true);

    try {
      const denominations = DENOMINATIONS.map((d) => ({
        denomination: d,
        quantity: quantities[d] || 0,
      }));

      const res = await fetch(`/api/cash-register/${registerId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          denominations,
          closedBySignature: signature.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al cerrar caja');
      }

      alert('Caja cerrada correctamente');
      onSuccess?.();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-6 bg-[var(--unit-surface)] rounded-xl border border-[var(--unit-border)]">
      <h2 className="text-lg font-semibold">Arqueo de Caja</h2>

      <div className="space-y-2">
        {DENOMINATIONS.map((denom) => (
          <div
            key={denom}
            className="flex items-center justify-between gap-4"
          >
            <span className="w-24 font-medium">
              S/ {denom.toFixed(2)}
            </span>

            <Input
              type="number"
              min="0"
              value={quantities[denom] || ''}
              onChange={(e) => handleChange(denom, e.target.value)}
              inputClassName="w-24"
            />

            <span className="w-24 text-right">
              S/ {((quantities[denom] || 0) * denom).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between">
          <span>Esperado:</span>
          <span>S/ {closingExpected.toFixed(2)}</span>
        </div>

        <div className="flex justify-between font-semibold">
          <span>Total contado:</span>
          <span>S/ {totalDeclared.toFixed(2)}</span>
        </div>

        <div className={`flex justify-between font-bold ${difference !== 0 ? 'text-red-600' : 'text-green-600'}`}>
          <span>Diferencia:</span>
          <span>S/ {difference.toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Firma (nombre completo)</label>
        <Input
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
        />
      </div>

      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Cerrando...' : 'Cerrar Caja'}
      </Button>
    </div>
  );
}