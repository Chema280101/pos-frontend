'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  User, 
  Tag, 
  Vault, 
  Receipt, 
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Drawer } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface ExpenseRecord {
  id: string;
  amount: number;
  reason: string;
  category: string;
  createdAt: string;
  cashRegisterId?: string;
  paymentMethod?: string;
  createdBy?: {
    id: string;
    name: string;
  } | null;
  cashRegister?: {
    id: string;
    unit: string;
    status: string;
  } | null;
}

export interface ExpenseDetailDrawerProps {
  expense: ExpenseRecord | null;
  open: boolean;
  onClose: () => void;
}

export function ExpenseDetailDrawer({
  expense,
  open,
  onClose
}: ExpenseDetailDrawerProps): JSX.Element {
  if (!expense) return <Drawer open={open} onClose={onClose} title="Detalle de Gasto" width="md"><div className="p-4 text-center text-xs text-[var(--unit-text-muted)]">Sin datos</div></Drawer>;

  const unit = expense.cashRegister?.unit || 'BARBERIA';

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Comprobante de Egreso"
      width="md"
    >
      <div className="space-y-6 pb-8">
        {/* Top Header Card */}
        <div className="p-5 rounded-unit-lg bg-[var(--unit-surface-elevated)] border border-[var(--unit-border)]/40 relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border',
                  unit === 'BARBERIA' 
                    ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' 
                    : 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20'
                )}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {unit === 'BARBERIA' ? 'Barbería' : 'SPA'}
                </span>

                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                  Egreso de Caja
                </span>
              </div>

              <h2 className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono pt-1">
                - S/ {Number(expense.amount || 0).toFixed(2)}
              </h2>

              <p className="text-xs text-[var(--unit-text-muted)]">
                Categoría: <span className="font-semibold text-[var(--unit-text)] capitalize">{expense.category || 'General'}</span>
              </p>
            </div>

            <div className="h-12 w-12 rounded-unit-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0 font-bold">
              <TrendingDown className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Motivo & Descripción */}
        <div className="p-4 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--unit-text-muted)] flex items-center gap-1.5">
            <Receipt className="h-3.5 w-3.5 text-[var(--unit-accent)]" />
            Motivo del Desembolso
          </h3>
          <p className="text-sm font-medium text-[var(--unit-text)] leading-relaxed">
            {expense.reason || 'Sin motivo detallado'}
          </p>
        </div>

        {/* Audit Details Grid */}
        <div className="p-4 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--unit-text-muted)]">
            Información de Auditoría
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-[var(--unit-border)]/20 pb-2">
              <span className="text-[var(--unit-text-muted)] flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Fecha y Hora:
              </span>
              <span className="font-semibold text-[var(--unit-text)] font-mono">
                {expense.createdAt ? format(new Date(expense.createdAt), "dd/MM/yyyy HH:mm", { locale: es }) : 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-[var(--unit-border)]/20 pb-2">
              <span className="text-[var(--unit-text-muted)] flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Registrado por:
              </span>
              <span className="font-semibold text-[var(--unit-text)]">
                {expense.createdBy?.name || 'Usuario del sistema'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[var(--unit-text-muted)] flex items-center gap-1.5">
                <Vault className="h-3.5 w-3.5" />
                Caja Asociada:
              </span>
              <span className="font-mono text-xs font-semibold text-[var(--unit-text)]">
                {expense.cashRegisterId ? `ID: ${expense.cashRegisterId.slice(0, 8)}...` : 'Caja Actual'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
