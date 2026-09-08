'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertCircle, 
  TrendingDown, 
  TrendingUp, 
  DollarSign, 
  FileText,
  User
} from 'lucide-react';
import { api } from '@/lib/api';
import { useUnitStore } from '@/store/unitStore';
import { Skeleton } from '@/components/ui';
import { EmptyStateCalendar } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';

interface CashRegisterRecord {
  id: string;
  unit: string;
  status: string;
  openingAmount: number;
  closingDeclared: number | null;
  closingExpected: number | null;
  closingDifference: number | null;
  closingNotes: string | null;
  closedBySignature: string | null;
  openedAt: string;
  closedAt: string | null;
  openedBy: { name: string } | null;
  closedBy: { name: string } | null;
}

export function RegisterHistory(): JSX.Element {
  const activeUnit = useUnitStore((s) => s.activeUnit);
  const unit = activeUnit === 'BARBERIA' ? 'BARBERIA' : 'SPA';
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: registersData, isLoading } = useQuery({
    queryKey: ['cash-register-history', unit],
    queryFn: async (): Promise<CashRegisterRecord[]> => {
      const { data } = await api.get(`/api/cash-register?unit=${unit}&limit=30`);
      return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    },
  });

  const registers = Array.isArray(registersData) ? registersData : [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-unit-lg" />
        ))}
      </div>
    );
  }

  if (registers.length === 0) {
    return (
      <EmptyStateCalendar
        title="No hay registros de caja anteriores"
        description="No se encontraron aperturas o cierres de caja anteriores. Los registros aparecerán aquí una vez que comiences a operar con el sistema de caja."
      />
    );
  }

  return (
    <div className="space-y-3">
      {registers.map((reg) => {
        const isExpanded = expandedId === reg.id;
        const isClosed = reg.status === 'CLOSED';
        const diff = Number(reg.closingDifference ?? 0);
        const isExact = isClosed && Math.abs(diff) < 0.01;
        const isSurplus = isClosed && diff > 0;
        const isDeficit = isClosed && diff < 0;

        return (
          <div
            key={reg.id}
            className={cn(
              'rounded-unit-lg border transition-all overflow-hidden',
              isExpanded 
                ? 'bg-[var(--unit-surface-elevated)] border-[var(--unit-accent)]/50 shadow-unit ring-1 ring-[var(--unit-accent)]/20' 
                : 'bg-[var(--unit-surface-elevated)] border-[var(--unit-border)]/50 hover:border-[var(--unit-border)] shadow-unit-sm'
            )}
          >
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : reg.id)}
              className="flex w-full items-center justify-between p-4 sm:p-5 text-left transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={cn(
                  'h-10 w-10 rounded-unit flex items-center justify-center shrink-0 font-bold',
                  isClosed 
                    ? 'bg-slate-500/10 text-[var(--unit-text-muted)] dark:text-slate-400' 
                    : 'bg-emerald-500/10 text-emerald-600 animate-pulse'
                )}>
                  {isClosed ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                      isClosed
                        ? 'bg-slate-500/10 text-[var(--unit-text)] dark:text-slate-300 border-slate-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold'
                    )}>
                      {isClosed ? 'Cerrada' : 'Turno Abierto'}
                    </span>

                    <span className="text-xs font-semibold text-[var(--unit-text)]">
                      {format(new Date(reg.openedAt), "d 'de' MMMM, yyyy · HH:mm", { locale: es })}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--unit-text-muted)] flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Responsable: <span className="font-medium text-[var(--unit-text)]">{reg.openedBy?.name ?? 'Desconocido'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 ml-3">
                {isClosed && (
                  <div className="text-right hidden sm:block">
                    <p className="text-[11px] uppercase tracking-wider text-[var(--unit-text-muted)] font-semibold">Diferencia</p>
                    <span
                      className={cn(
                        'text-xs font-mono font-bold inline-flex items-center gap-1 px-2 py-0.5 rounded-md border',
                        isExact
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : isSurplus
                          ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                          : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                      )}
                    >
                      {isExact ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      {diff >= 0 ? '+' : ''}S/ {diff.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="h-8 w-8 rounded-unit bg-[var(--unit-surface)] flex items-center justify-center text-[var(--unit-text-muted)]">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-[var(--unit-accent)]" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>
            </button>

            {/* Expanded Details Breakdown */}
            {isExpanded && (
              <div className="border-t border-[var(--unit-border)]/40 p-4 sm:p-5 bg-[var(--unit-surface)]/50 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-unit border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] space-y-0.5">
                    <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Apertura Inicial</p>
                    <p className="text-sm font-bold font-mono text-[var(--unit-text)]">
                      S/ {Number(reg.openingAmount || 0).toFixed(2)}
                    </p>
                  </div>

                  {isClosed && reg.closingExpected != null && (
                    <div className="p-3 rounded-unit border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] space-y-0.5">
                      <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Efectivo Esperado</p>
                      <p className="text-sm font-bold font-mono text-blue-600 dark:text-blue-400">
                        S/ {Number(reg.closingExpected).toFixed(2)}
                      </p>
                    </div>
                  )}

                  {isClosed && reg.closingDeclared != null && (
                    <div className="p-3 rounded-unit border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] space-y-0.5">
                      <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Efectivo Contado</p>
                      <p className="text-sm font-bold font-mono text-purple-600 dark:text-purple-400">
                        S/ {Number(reg.closingDeclared).toFixed(2)}
                      </p>
                    </div>
                  )}

                  {isClosed && (
                    <div className="p-3 rounded-unit border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] space-y-0.5">
                      <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Balance Cierre</p>
                      <p className={cn(
                        'text-sm font-bold font-mono',
                        isExact ? 'text-emerald-600' : isSurplus ? 'text-blue-600' : 'text-rose-600'
                      )}>
                        {diff >= 0 ? '+' : ''}S/ {diff.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Audit and Closure Meta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-t border-[var(--unit-border)]/30 pt-3">
                  {reg.closedAt && (
                    <div>
                      <span className="text-[var(--unit-text-muted)]">Fecha de Cierre: </span>
                      <span className="font-semibold text-[var(--unit-text)]">
                        {format(new Date(reg.closedAt), "d 'de' MMMM, yyyy · HH:mm", { locale: es })}
                      </span>
                    </div>
                  )}

                  {reg.closedBy && (
                    <div>
                      <span className="text-[var(--unit-text-muted)]">Cerrado por: </span>
                      <span className="font-semibold text-[var(--unit-text)]">{reg.closedBy.name}</span>
                    </div>
                  )}

                  {reg.closedBySignature && (
                    <div>
                      <span className="text-[var(--unit-text-muted)]">Firma / Identificador: </span>
                      <span className="font-semibold text-[var(--unit-text)]">{reg.closedBySignature}</span>
                    </div>
                  )}
                </div>

                {reg.closingNotes && (
                  <div className="p-3 rounded-unit bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300">
                    <p className="font-bold flex items-center gap-1.5 mb-0.5">
                      <FileText className="h-3.5 w-3.5" />
                      Observaciones de Cierre:
                    </p>
                    <p className="leading-relaxed">{reg.closingNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}