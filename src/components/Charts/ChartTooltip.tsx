'use client';

import React from 'react';

export interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    color?: string;
    dataKey?: string;
    payload?: Record<string, any>;
  }>;
  label?: string | number;
  currencyKey?: string | string[];
  unitSuffix?: string;
  showPercentage?: boolean;
}

export function ChartTooltip({
  active,
  payload,
  label,
  currencyKey = ['ventas', 'total', 'revenue', 'ingresos', 'income', 'expenses', 'ticketPromedio', 'egresos', 'balance', 'monto'],
  unitSuffix,
  showPercentage = false,
}: ChartTooltipProps): JSX.Element | null {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const currencyKeysList = Array.isArray(currencyKey) ? currencyKey : [currencyKey];

  const totalValue = showPercentage
    ? payload.reduce((sum, item) => sum + (typeof item.value === 'number' ? item.value : 0), 0)
    : 0;

  return (
    <div className="min-w-[170px] rounded-unit border border-[var(--unit-border)]/50 bg-[var(--unit-surface-elevated)]/95 p-3 text-[var(--unit-text)] shadow-unit-lg backdrop-blur-md transition-all">
      {label !== undefined && label !== null && (
        <div className="mb-2 border-b border-[var(--unit-border)]/30 pb-1.5 font-medium text-xs tracking-wider uppercase text-[var(--unit-text-muted)]">
          {label}
        </div>
      )}
      <div className="space-y-1.5">
        {payload.map((entry, index) => {
          const name = entry.name || entry.dataKey || 'Valor';
          const val = entry.value;
          const isCurrency =
            (typeof entry.dataKey === 'string' &&
              currencyKeysList.some((k) => entry.dataKey?.toLowerCase().includes(k.toLowerCase()))) ||
            (typeof name === 'string' && currencyKeysList.some((k) => name.toLowerCase().includes(k.toLowerCase())));

          const formattedValue =
            typeof val === 'number'
              ? isCurrency
                ? `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `${val.toLocaleString('es-PE')}${unitSuffix ? ` ${unitSuffix}` : ''}`
              : val;

          const percentage =
            showPercentage && totalValue > 0 && typeof val === 'number'
              ? ((val / totalValue) * 100).toFixed(1)
              : null;

          return (
            <div key={`tooltip-item-${index}`} className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full ring-2 ring-[var(--unit-surface)]"
                  style={{ backgroundColor: entry.color || '#3b82f6' }}
                />
                <span className="text-[var(--unit-text)] font-normal capitalize">{name}</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-[var(--unit-text)]">
                <span>{formattedValue}</span>
                {percentage && (
                  <span className="rounded bg-[var(--unit-accent)]/10 px-1 py-0.5 text-[10px] text-[var(--unit-text)]">
                    {percentage}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
