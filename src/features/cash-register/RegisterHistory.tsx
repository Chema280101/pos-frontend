'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '@/lib/api';
import { useUnitStore } from '@/store/unitStore';
import { Badge, Skeleton } from '@/components/ui';
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

  const { data: registers, isLoading } = useQuery({
    queryKey: ['cash-register-history', unit],
    queryFn: async (): Promise<CashRegisterRecord[]> => {
      const { data } = await api.get<CashRegisterRecord[]>(`/api/cash-register?unit=${unit}&limit=30`);
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!registers || registers.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--unit-text)]/70">
        No hay registros de caja anteriores.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {registers.map((reg) => {
        const isExpanded = expandedId === reg.id;
        const isClosed = reg.status === 'CLOSED';
        const diff = reg.closingDifference ?? 0;

        return (
          <div
            key={reg.id}
            className="rounded-[var(--unit-border-radius)] border bg-[var(--unit-surface-elevated)] transition-colors"
            style={{ borderColor: 'var(--unit-border)' }}
          >
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : reg.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-3">
                <Badge variant={isClosed ? 'default' : 'warning'}>
                  {isClosed ? 'Cerrada' : reg.status}
                </Badge>
                <div>
                  <p className="text-sm font-medium text-[var(--unit-text)]">
                    {format(new Date(reg.openedAt), "d MMM yyyy · HH:mm", { locale: es })}
                  </p>
                  <p className="text-xs text-[var(--unit-text)]/60">
                    {reg.openedBy?.name ?? 'Desconocido'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isClosed && (
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      diff === 0 ? 'text-green-600' : Math.abs(diff) <= 5 ? 'text-amber-600' : 'text-red-600'
                    )}
                  >
                    Dif: {diff >= 0 ? '+' : ''}S/ {diff.toFixed(2)}
                  </span>
                )}
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-[var(--unit-text)]/50" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[var(--unit-text)]/50" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: 'var(--unit-border)' }}>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Detail label="Apertura" value={`S/ ${Number(reg.openingAmount).toFixed(2)}`} />
                  {isClosed && reg.closingExpected != null && (
                    <Detail label="Esperado" value={`S/ ${Number(reg.closingExpected).toFixed(2)}`} />
                  )}
                  {isClosed && reg.closingDeclared != null && (
                    <Detail label="Declarado" value={`S/ ${Number(reg.closingDeclared).toFixed(2)}`} />
                  )}
                  {reg.closedAt && (
                    <Detail
                      label="Cerrada"
                      value={format(new Date(reg.closedAt), "d MMM yyyy · HH:mm", { locale: es })}
                    />
                  )}
                  {reg.closedBy && <Detail label="Cerrada por" value={reg.closedBy.name} />}
                  {reg.closedBySignature && <Detail label="Firma" value={reg.closedBySignature} />}
                  {reg.closingNotes && (
                    <div className="col-span-2">
                      <Detail label="Notas" value={reg.closingNotes} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div>
      <p className="text-xs text-[var(--unit-text)]/60">{label}</p>
      <p className="font-medium text-[var(--unit-text)]">{value}</p>
    </div>
  );
}