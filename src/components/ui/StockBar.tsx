'use client';

import { cn } from '@/lib/utils';

export interface StockBarProps {
  current: number;
  min: number;
  max?: number | null;
  className?: string;
  showLabels?: boolean;
}

/** Barra de nivel de stock: verde (ok), amarillo (bajo), rojo (crítico). */
export function StockBar({
  current,
  min,
  max,
  className,
  showLabels = true,
}: StockBarProps): JSX.Element {
  const effectiveMax = max != null && max > 0 ? Math.max(max, current, min) : Math.max(current, min, 1);
  const pct = effectiveMax > 0 ? Math.min(100, (current / effectiveMax) * 100) : 0;
  const status = current <= 0 ? 'critical' : current < min ? 'low' : 'ok';
  const barColor = status === 'ok' ? 'bg-green-500' : status === 'low' ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className={cn('w-full', className)} role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={effectiveMax}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--unit-primary)]/30">
        <div className={cn('h-full rounded-full transition-all duration-300', barColor)} style={{ width: `${pct}%` }} />
      </div>
      {showLabels && (
        <div className="mt-1 flex justify-between text-xs text-[var(--unit-text)]/70">
          <span>{current} / {effectiveMax}</span>
          {min > 0 && <span>Mín: {min}</span>}
        </div>
      )}
    </div>
  );
}
