'use client';

import { useQuery } from '@tanstack/react-query';
import { 
  Scissors, 
  Clock, 
  Tag, 
  Edit, 
  Loader2,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { api } from '@/lib/api';
import { Drawer } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Service } from '@/types/service';

export interface ServiceDetailDrawerProps {
  serviceId: string | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (service: Service) => void;
}

export function ServiceDetailDrawer({
  serviceId,
  open,
  onClose,
  onEdit
}: ServiceDetailDrawerProps): JSX.Element {
  const { data: service, isLoading } = useQuery<Service>({
    queryKey: ['service-detail', serviceId],
    queryFn: async () => {
      if (!serviceId) throw new Error('No ID');
      const { data } = await api.get(`/api/services/${serviceId}`);
      return data?.data || data;
    },
    enabled: !!serviceId && open,
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Ficha Técnica de Servicio"
      width="lg"
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--unit-accent)]" />
          <p className="text-xs text-[var(--unit-text-muted)] font-medium">Cargando datos del servicio...</p>
        </div>
      ) : !service ? (
        <div className="p-6 text-center text-sm text-[var(--unit-text-muted)]">
          No se pudo encontrar la información del servicio.
        </div>
      ) : (
        <div className="space-y-6 pb-8">
          {/* Header Card */}
          <div className="p-5 rounded-unit-lg bg-[var(--unit-surface-elevated)] border border-[var(--unit-border)]/40 relative overflow-hidden">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border',
                    service.unit === 'BARBERIA' 
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' 
                      : 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20'
                  )}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {service.unit === 'BARBERIA' ? 'Barbería' : 'SPA'}
                  </span>

                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                    service.isActive 
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                  )}>
                    {service.isActive ? 'Activo' : 'Inactivo'}
                  </span>

                  {service.isComboEligible && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600 border border-purple-500/20">
                      Apto para Combo
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-bold text-[var(--unit-text)] tracking-tight pt-1">
                  {service.name}
                </h2>

                <p className="text-xs text-[var(--unit-text-muted)]">
                  Categoría: <span className="font-semibold text-[var(--unit-text)]">{service.category?.name || 'General'}</span>
                </p>
              </div>

              <div className="h-12 w-12 rounded-unit-lg bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] flex items-center justify-center shrink-0">
                <Scissors className="h-6 w-6" />
              </div>
            </div>

            {/* Quick action buttons row */}
            {onEdit && (
              <div className="flex flex-wrap items-center gap-2 pt-4 mt-4 border-t border-[var(--unit-border)]/30">
                <button
                  onClick={() => onEdit(service)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-unit bg-[var(--unit-accent)] text-white text-xs font-bold hover:bg-[var(--unit-accent)]/90 transition-all shadow-unit-sm"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Editar Servicio
                </button>
              </div>
            )}
          </div>

          {/* Micro Status Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] space-y-1">
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Precio Base</p>
              <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                S/ {Number(service.price || 0).toFixed(2)}
              </p>
            </div>

            <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] space-y-1">
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Duración Estimada</p>
              <p className="text-lg font-bold text-[var(--unit-text)] font-mono">
                {service.durationMin || 30} min
              </p>
            </div>

            <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] space-y-1 col-span-2 sm:col-span-1">
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Total Atenciones</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400 font-mono flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" />
                {service.timesVended || 0}
              </p>
            </div>
          </div>

          {/* Description & Technical Specs */}
          <div className="p-4 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--unit-text-muted)] flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-[var(--unit-accent)]" />
              Descripción y Protocolo
            </h3>

            <p className="text-xs text-[var(--unit-text)] leading-relaxed">
              {service.description || 'Sin descripción detallada registrada para este servicio.'}
            </p>
          </div>
        </div>
      )}
    </Drawer>
  );
}
