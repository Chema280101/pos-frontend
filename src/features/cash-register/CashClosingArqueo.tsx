'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ArqueoProps {
  denominations: Record<number, number>;
  expectedCash: number;
  opening: number;
  totalSales: number;
  cash: number;
  cashFromSales: number;
  card: number;
  transfer: number;
  wallet: number;
  expenses: number;
  cashEntries: number;
}

const DENOM_ORDER = [200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1];

export function CashClosingArqueo({
  denominations,
  expectedCash,
  opening,
  totalSales,
  cash,
  cashFromSales,
  card,
  transfer,
  wallet,
  expenses,
  cashEntries,
}: ArqueoProps): JSX.Element {
  const totalDeclared = useMemo(
    () => DENOM_ORDER.reduce((acc, d) => acc + d * (denominations[d] ?? 0), 0),
    [denominations]
  );

  const difference = totalDeclared - expectedCash;
  const status = difference === 0 ? 'ok' : Math.abs(difference) <= 5 ? 'warn' : 'error';

  return (
    <motion.div
      className="rounded-[var(--unit-border-radius)] border bg-[var(--unit-surface-elevated)] p-6"
      style={{ borderColor: 'var(--unit-border)', boxShadow: 'var(--unit-shadow)' }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="font-heading text-lg font-semibold text-[var(--unit-text)]">
        Resumen de Arqueo
      </h3>

      {/* Desglose por método */}
      <div className="mt-4 space-y-2">
        <Row label="Apertura" value={opening} />
        <div className="border-t py-2" style={{ borderColor: 'var(--unit-border)' }}>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--unit-text)]/60">
            Ventas por método
          </p>
          <Row label="Efectivo" value={cashFromSales} />
          <Row label="Tarjeta" value={card} />
          <Row label="Transferencia" value={transfer} />
          <Row label="Billetera digital" value={wallet} />
          <Row label="Total ventas" value={totalSales} bold />
        </div>
        <Row label="Ingresos manuales" value={cashEntries} className="text-emerald-600" />
        <Row label="Egresos" value={-expenses} className="text-red-500" />
      </div>

      {/* Conteo de denominaciones */}
      <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--unit-border)' }}>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--unit-text)]/60">
          Conteo de billetes y monedas
        </p>
        <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-sm">
          <span className="font-medium text-[var(--unit-text)]/60">Denominación</span>
          <span className="text-center font-medium text-[var(--unit-text)]/60">Cant.</span>
          <span className="text-right font-medium text-[var(--unit-text)]/60">Subtotal</span>
          {DENOM_ORDER.map((d) => {
            const qty = denominations[d] ?? 0;
            if (qty === 0) return null;
            return (
              <Row3
                key={d}
                denom={`S/ ${d.toFixed(2)}`}
                qty={qty}
                subtotal={qty * d}
              />
            );
          })}
        </div>
      </div>

      {/* Totales */}
      <div className="mt-4 space-y-2 border-t pt-4" style={{ borderColor: 'var(--unit-border)' }}>
        <Row label="Efectivo esperado" value={expectedCash} bold />
        <Row label="Efectivo declarado" value={totalDeclared} bold />
        <div
          className={cn(
            'flex items-center justify-between rounded-[var(--unit-radius-sm)] px-3 py-2 text-sm font-bold',
            status === 'ok' && 'bg-green-500/10 text-green-700',
            status === 'warn' && 'bg-amber-500/10 text-amber-700',
            status === 'error' && 'bg-red-500/10 text-red-700'
          )}
        >
          <span>Diferencia</span>
          <span>
            {difference >= 0 ? '+' : ''}S/ {difference.toFixed(2)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function Row({
  label,
  value,
  bold,
  className,
}: {
  label: string;
  value: number;
  bold?: boolean;
  className?: string;
}): JSX.Element {
  return (
    <div className={cn('flex justify-between text-sm', className)}>
      <span className={cn('text-[var(--unit-text)]', bold && 'font-semibold')}>{label}</span>
      <span className={cn('text-[var(--unit-text)]', bold && 'font-semibold')}>
        S/ {value.toFixed(2)}
      </span>
    </div>
  );
}

function Row3({
  denom,
  qty,
  subtotal,
}: {
  denom: string;
  qty: number;
  subtotal: number;
}): JSX.Element {
  return (
    <>
      <span className="text-sm text-[var(--unit-text)]">{denom}</span>
      <span className="text-center text-sm text-[var(--unit-text)]">{qty}</span>
      <span className="text-right text-sm text-[var(--unit-text)]">S/ {subtotal.toFixed(2)}</span>
    </>
  );
}