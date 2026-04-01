'use client';

import { useState, useMemo } from 'react';
import { Button, Input } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { printCashCloseReceipt, type CashCloseData } from '@/lib/cashCloseReceipt';

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
  const { success, error } = useToast();
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
      error('La firma es obligatoria');
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

      const closeData = await res.json();
      
      success('Caja cerrada correctamente');
      onSuccess?.();
      
      // Generar PDF de cierre de caja
      setTimeout(() => {
        generateCashClosePDF(closeData);
      }, 1000);
      
    } catch (err: any) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  }

  function generateCashClosePDF(closeData: any) {
    try {
      console.log('🔍 DEBUG - Datos del cierre recibidos:', closeData);
      
      const cashCloseData: CashCloseData = {
        unit: closeData.unit || 'BARBERIA',
        registerId: closeData.id || registerId,
        openedAt: closeData.openedAt || new Date().toISOString(),
        closedAt: closeData.closedAt || new Date().toISOString(),
        openedBy: closeData.openedByName || 'Usuario',
        closedBy: closeData.closedByName || 'Usuario',
        openingAmount: Number(closeData.openingAmount) || 0,
        cashFromSales: Number(closeData.cashFromSales) || 0,
        cardSales: Number(closeData.cardSales) || 0,
        transferSales: Number(closeData.transferSales) || 0,
        walletSales: Number(closeData.walletSales) || 0,
        totalSales: Number(closeData.totalSales) || 0,
        manualIncome: Number(closeData.manualIncome) || 0,
        expenses: Number(closeData.totalExpenses) || 0,
        expectedCash: Number(closeData.closingExpected) || 0,
        closingDeclared: Number(closeData.closingDeclared) || 0,
        difference: Number(closeData.difference) || 0,
        denominations: closeData.denominations || [],
        closingNotes: closeData.closingNotes || '',
        businessName: 'Barbería y Spa POS',
        businessAddress: 'Dirección del negocio',
        businessPhone: 'Teléfono de contacto',
      };

      console.log('🔍 DEBUG - Datos para PDF:', cashCloseData);

      const html = printCashCloseReceipt(cashCloseData);
      if (html) {
        // Si el popup está bloqueado, mostrar en un modal
        console.log('El popup está bloqueado. Mostrando PDF en modal...');
        // TODO: Implementar modal para mostrar el PDF si el popup está bloqueado
      }
    } catch (error: any) {
      console.error('Error al generar PDF de cierre de caja:', error);
      error(error?.message || 'Error al generar PDF de cierre de caja');
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