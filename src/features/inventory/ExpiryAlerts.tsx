'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, differenceInDays, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  unit: string;
  stock: number;
  expiryDate: string | null;
}

const EXPIRY_WARNING_DAYS = 30;
const EXPIRY_CRITICAL_DAYS = 7;

export function ExpiryAlerts(): JSX.Element {
  const { data: products, isLoading } = useQuery({
    queryKey: ['inventory', 'expiry-alerts'],
    queryFn: async (): Promise<Product[]> => {
      const { data } = await api.get<{ data: Product[] }>('/api/inventory/products?limit=500');
      return data.data;
    },
  });

  const alerts = useMemo(() => {
    if (!products) return [];
    const now = new Date();
    return products
      .filter((p) => p.expiryDate && p.stock > 0)
      .map((p) => {
        const expiry = new Date(p.expiryDate!);
        const daysLeft = differenceInDays(expiry, now);
        const expired = isPast(expiry);
        return { ...p, expiry, daysLeft, expired };
      })
      .filter((p) => p.daysLeft <= EXPIRY_WARNING_DAYS || p.expired)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [products]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="mb-3 h-10 w-10 text-green-500/50" />
        <p className="text-sm font-medium text-[var(--unit-text)]">Sin alertas de vencimiento</p>
        <p className="mt-1 text-xs text-[var(--unit-text)]/60">
          Ningún producto está próximo a vencer en los próximos {EXPIRY_WARNING_DAYS} días.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-[var(--unit-text)]/70">
        {alerts.length} producto(s) con alerta de vencimiento
      </p>
      {alerts.map((p) => {
        const isCritical = p.expired || p.daysLeft <= EXPIRY_CRITICAL_DAYS;
        return (
          <div
            key={p.id}
            className={cn(
              'flex items-center gap-3 rounded-[var(--unit-border-radius)] border px-4 py-3',
              isCritical
                ? 'border-red-500/30 bg-red-50/10'
                : 'border-amber-500/30 bg-amber-50/10'
            )}
          >
            <AlertTriangle
              className={cn('h-5 w-5 shrink-0', isCritical ? 'text-red-500' : 'text-amber-500')}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--unit-text)]">{p.name}</p>
              <p className="text-xs text-[var(--unit-text)]/60">
                {p.unit} · Stock: {p.stock} · Vence:{' '}
                {format(p.expiry, 'd MMM yyyy', { locale: es })}
              </p>
            </div>
            <Badge variant={p.expired ? 'danger' : isCritical ? 'danger' : 'warning'}>
              {p.expired ? 'Vencido' : `${p.daysLeft}d`}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}