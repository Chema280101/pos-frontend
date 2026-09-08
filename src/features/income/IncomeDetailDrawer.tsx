'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  User, 
  Tag, 
  CreditCard, 
  Smartphone, 
  ArrowRightLeft, 
  Banknote, 
  CheckCircle2, 
  Clock, 
  Receipt,
  Scissors,
  Package
} from 'lucide-react';
import { Drawer } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface IncomeDetailDrawerProps {
  income: any | null;
  open: boolean;
  onClose: () => void;
}

export function IncomeDetailDrawer({
  income,
  open,
  onClose
}: IncomeDetailDrawerProps): JSX.Element {
  if (!income) return <Drawer open={open} onClose={onClose} title="Detalle de Ingreso" width="md"><div className="p-4 text-center text-xs text-[var(--unit-text-muted)]">Sin datos</div></Drawer>;

  const getMethodIcon = (method: string) => {
    switch (method?.toUpperCase()) {
      case 'CASH':
      case 'EFECTIVO':
        return <Banknote className="h-4 w-4 text-emerald-600" />;
      case 'CARD':
      case 'TARJETA':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'TRANSFER':
      case 'TRANSFERENCIA':
        return <ArrowRightLeft className="h-4 w-4 text-purple-600" />;
      case 'DIGITAL_WALLET':
      case 'YAPE':
      case 'PLIN':
        return <Smartphone className="h-4 w-4 text-amber-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-emerald-600" />;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method?.toUpperCase()) {
      case 'CASH': return 'Efectivo';
      case 'CARD': return 'Tarjeta';
      case 'TRANSFER': return 'Transferencia';
      case 'DIGITAL_WALLET': return 'Billetera Digital';
      default: return method || 'Efectivo';
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Comprobante de Ingreso"
      width="md"
    >
      <div className="space-y-6 pb-8">
        {/* Top Header Card */}
        <div className="p-5 rounded-unit-lg bg-[var(--unit-surface-elevated)] border border-[var(--unit-border)]/40 relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  {income.saleNumber ? `Venta #${income.saleNumber}` : 'Ingreso de Caja'}
                </span>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--unit-surface)] border border-[var(--unit-border)]/60 text-[var(--unit-text)]">
                  {getMethodIcon(income.paymentMethod)}
                  {getMethodLabel(income.paymentMethod)}
                </span>
              </div>

              <h2 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono pt-1">
                + S/ {Number(income.total || income.amount || 0).toFixed(2)}
              </h2>

              <p className="text-xs text-[var(--unit-text-muted)]">
                Cliente: <span className="font-semibold text-[var(--unit-text)]">{income.customer?.name || 'Cliente Ocasional'}</span>
              </p>
            </div>

            <div className="h-12 w-12 rounded-unit-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 font-bold">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Motivo o resumen */}
        {(income.reason || income.summary) && (
          <div className="p-4 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--unit-text-muted)] flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5 text-[var(--unit-accent)]" />
              Concepto / Resumen
            </h3>
            <p className="text-sm font-medium text-[var(--unit-text)] leading-relaxed">
              {income.reason || income.summary}
            </p>
          </div>
        )}

        {/* Audit Details */}
        <div className="p-4 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--unit-text-muted)]">
            Detalles de la Transacción
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-[var(--unit-border)]/20 pb-2">
              <span className="text-[var(--unit-text-muted)] flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Fecha y Hora:
              </span>
              <span className="font-semibold text-[var(--unit-text)] font-mono">
                {income.createdAt ? format(new Date(income.createdAt), "dd/MM/yyyy HH:mm", { locale: es }) : 'N/A'}
              </span>
            </div>

            {income.appointment && (
              <div className="flex items-center justify-between border-b border-[var(--unit-border)]/20 pb-2">
                <span className="text-[var(--unit-text-muted)] flex items-center gap-1.5">
                  <Scissors className="h-3.5 w-3.5" />
                  Cita Vinculada:
                </span>
                <span className="font-semibold text-[var(--unit-accent)] font-mono">
                  {format(new Date(income.appointment.startTime), "dd/MM/yyyy HH:mm", { locale: es })}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[var(--unit-text-muted)] flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Estado:
              </span>
              <span className="font-bold text-emerald-600 uppercase">
                {income.status === 'completed' ? 'Completado' : income.status || 'Registrado'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
