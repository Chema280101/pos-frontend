'use client';

import { Store, TrendingUp, Clock, Calendar, DollarSign, CheckCircle2, ShoppingBag, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { BusinessUnit } from '@/types/pos';
import { cn } from '@/lib/utils';

interface POSHeaderProps {
  unit: BusinessUnit;
  onUnitChange?: (unit: BusinessUnit) => void;
  totalSales: number;
  pendingCount: number;
}

export function POSHeader({ unit, totalSales, pendingCount }: POSHeaderProps) {
  const currentDate = format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es });
  const currentTime = format(new Date(), 'HH:mm');

  return (
    <div className="space-y-4 mb-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--unit-border)]/40 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] text-xs font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--unit-accent)] animate-pulse" />
              Terminal de Cobro • {unit === 'BARBERIA' ? 'Barbería' : 'SPA'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--unit-text)] tracking-tight">
            Punto de Venta (POS)
          </h1>
          <p className="text-xs sm:text-sm text-[var(--unit-text-muted)]">
            Venta de servicios, productos retail y facturación de citas en tiempo real
          </p>
        </div>
      </div>

      {/* Micro Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3">
          <div className="h-9 w-9 rounded-unit bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Fecha Operativa</p>
            <p className="text-xs sm:text-sm font-bold text-[var(--unit-text)] capitalize">{currentDate}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3">
          <div className="h-9 w-9 rounded-unit bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Ventas Turno</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              S/ {Number(totalSales || 0).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3">
          <div className={cn(
            "h-9 w-9 rounded-unit flex items-center justify-center font-bold",
            pendingCount > 0 ? "bg-amber-500/10 text-amber-600" : "bg-slate-500/10 text-[var(--unit-text-muted)]"
          )}>
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Ventas Pendientes</p>
            <p className={cn("text-lg font-bold font-mono", pendingCount > 0 ? "text-amber-600" : "text-[var(--unit-text)]")}>
              {pendingCount}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3">
          <div className="h-9 w-9 rounded-unit bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Hora Sistema</p>
            <p className="text-lg font-bold text-[var(--unit-text)] font-mono">{currentTime}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
