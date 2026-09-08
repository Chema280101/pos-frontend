'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Package, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Edit,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { Drawer } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface SupplierRecord {
  id: string;
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: {
    stockEntries: number;
  };
}

export interface SupplierDetailDrawerProps {
  supplier: SupplierRecord | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (supplier: SupplierRecord) => void;
}

export function SupplierDetailDrawer({
  supplier,
  open,
  onClose,
  onEdit
}: SupplierDetailDrawerProps): JSX.Element {
  if (!supplier) return <Drawer open={open} onClose={onClose} title="Ficha de Proveedor" width="md"><div className="p-4 text-center text-xs text-[var(--unit-text-muted)]">Sin datos</div></Drawer>;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Ficha Comercial de Proveedor"
      width="md"
    >
      <div className="space-y-6 pb-8">
        {/* Top Header Card */}
        <div className="p-5 rounded-unit-lg bg-[var(--unit-surface-elevated)] border border-[var(--unit-border)]/40 relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                  supplier.isActive 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                )}>
                  {supplier.isActive ? 'Activo' : 'Inactivo'}
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  <Package className="h-3 w-3" />
                  {supplier._count?.stockEntries || 0} Entradas Registradas
                </span>
              </div>

              <h2 className="text-xl font-bold text-[var(--unit-text)] tracking-tight pt-1">
                {supplier.name}
              </h2>

              {supplier.contactName && (
                <p className="text-xs text-[var(--unit-text-muted)] flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  Contacto: <span className="font-semibold text-[var(--unit-text)]">{supplier.contactName}</span>
                </p>
              )}
            </div>

            <div className="h-12 w-12 rounded-unit-lg bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] flex items-center justify-center shrink-0">
              <Building2 className="h-6 w-6" />
            </div>
          </div>

          {onEdit && (
            <div className="flex flex-wrap items-center gap-2 pt-4 mt-4 border-t border-[var(--unit-border)]/30">
              <button
                onClick={() => onEdit(supplier)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-unit bg-[var(--unit-accent)] text-white text-xs font-bold hover:bg-[var(--unit-accent)]/90 transition-all shadow-unit-sm"
              >
                <Edit className="h-3.5 w-3.5" />
                Editar Proveedor
              </button>
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="p-4 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--unit-text-muted)]">
            Canales de Contacto
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-[var(--unit-border)]/20 pb-2">
              <span className="text-[var(--unit-text-muted)] flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-emerald-600" />
                Teléfono:
              </span>
              <span className="font-semibold text-[var(--unit-text)] font-mono">
                {supplier.phone || 'No registrado'}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-[var(--unit-border)]/20 pb-2">
              <span className="text-[var(--unit-text-muted)] flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-blue-600" />
                Email:
              </span>
              <span className="font-semibold text-[var(--unit-text)]">
                {supplier.email || 'No registrado'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[var(--unit-text-muted)] flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-rose-600" />
                Dirección / Ubicación:
              </span>
              <span className="font-semibold text-[var(--unit-text)] text-right truncate max-w-xs">
                {supplier.address || 'No registrada'}
              </span>
            </div>
          </div>
        </div>

        {/* Registration Meta */}
        <div className="p-4 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[var(--unit-text-muted)] flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Fecha de Registro:
            </span>
            <span className="font-semibold text-[var(--unit-text)] font-mono">
              {supplier.createdAt ? format(new Date(supplier.createdAt), "d 'de' MMMM, yyyy", { locale: es }) : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
