'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Package, 
  Clock, 
  DollarSign, 
  Tag, 
  Scissors, 
  CheckCircle2, 
  XCircle, 
  Edit,
  User,
  Percent,
  Layers
} from 'lucide-react';
import { Drawer } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Package as PackageType } from '@/types/service';

export interface PackageDetailDrawerProps {
  pkg: PackageType | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (pkg: PackageType) => void;
}

export function PackageDetailDrawer({
  pkg,
  open,
  onClose,
  onEdit
}: PackageDetailDrawerProps): JSX.Element {
  if (!pkg) return <Drawer open={open} onClose={onClose} title="Ficha de Paquete" width="md"><div className="p-4 text-center text-xs text-[var(--unit-text-muted)]">Sin datos</div></Drawer>;

  const isActive = pkg.status === 'ACTIVE' || (pkg as any).isActive;
  const services = pkg.services || [];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Ficha Comercial de Paquete"
      width="lg"
    >
      <div className="space-y-6 pb-8">
        {/* Top Header Card */}
        <div className="p-5 rounded-unit-lg bg-[var(--unit-surface-elevated)] border border-[var(--unit-border)]/40 relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                )}>
                  {isActive ? 'Activo' : 'Inactivo'}
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                  <Scissors className="h-3 w-3" />
                  {services.length} Servicios Incluidos
                </span>
              </div>

              <h2 className="text-xl font-bold text-[var(--unit-text)] tracking-tight pt-1">
                {pkg.name}
              </h2>

              <p className="text-xs text-[var(--unit-text-muted)]">
                {pkg.description || 'Paquete combinado de atención y tratamientos.'}
              </p>
            </div>

            <div className="h-12 w-12 rounded-unit-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
              <Package className="h-6 w-6" />
            </div>
          </div>

          {onEdit && (
            <div className="flex flex-wrap items-center gap-2 pt-4 mt-4 border-t border-[var(--unit-border)]/30">
              <button
                onClick={() => onEdit(pkg)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-unit bg-[var(--unit-accent)] text-white text-xs font-bold hover:bg-[var(--unit-accent)]/90 transition-all shadow-unit-sm"
              >
                <Edit className="h-3.5 w-3.5" />
                Editar Paquete
              </button>
            </div>
          )}
        </div>

        {/* Micro Status Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] space-y-1">
            <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Precio Fijo del Combo</p>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              S/ {Number(pkg.fixedPrice || 0).toFixed(2)}
            </p>
          </div>

          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] space-y-1">
            <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Duración Estimada Total</p>
            <p className="text-xl font-bold text-[var(--unit-text)] font-mono flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-[var(--unit-accent)]" />
              {pkg.durationMin || 60} min
            </p>
          </div>
        </div>

        {/* Services Included List */}
        <div className="p-4 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--unit-text-muted)] flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-[var(--unit-accent)]" />
            Servicios que componen el paquete
          </h3>

          <div className="space-y-2">
            {services.map((item, idx) => (
              <div key={item.id || idx} className="flex items-center justify-between p-3 rounded-unit bg-[var(--unit-surface)] border border-[var(--unit-border)]/50 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-unit bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] flex items-center justify-center font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <span className="font-bold text-[var(--unit-text)]">{item.service?.name || 'Servicio'}</span>
                    <p className="text-[11px] text-[var(--unit-text-muted)]">{item.service?.durationMin || 30} min</p>
                  </div>
                </div>

                {item.commissionShare != null && (
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-md">
                    Comisión: {item.commissionShare}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
