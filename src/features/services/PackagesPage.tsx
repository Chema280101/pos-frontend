'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Package, 
  Plus, 
  Search, 
  RefreshCw, 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  DollarSign, 
  Tag, 
  Eye, 
  Edit, 
  Trash2, 
  Scissors, 
  CheckCircle2, 
  XCircle, 
  Layers 
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useUnitStore } from '@/store/unitStore';
import { DataTable } from '@/components/ui/DataTable';
import { TableToolbar } from '@/components/ui/TableToolbar';
import { TableBadge } from '@/components/ui/TableBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PackageDetailDrawer } from './PackageDetailDrawer';
import { PackagesMetrics } from './PackagesMetrics';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import type { Package as PackageType } from '@/types/service';

export function PackagesPage(): JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const activeUnit = useUnitStore((s) => s.activeUnit);
  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === 'ADMIN';
  const { success, error: toastError } = useToast();

  // Navigation tab: 'all' | 'metrics'
  const [activeTab, setActiveTab] = useState<'all' | 'metrics'>('all');

  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Drawer and Dialog state
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<PackageType | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Packages Query
  const { 
    data: packagesData, 
    isLoading, 
    isFetching, 
    refetch 
  } = useQuery({
    queryKey: ['packages', activeUnit, debouncedSearch, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeUnit) params.set('unit', activeUnit);
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter) params.set('status', statusFilter);

      const { data } = await api.get(`/api/packages?${params}`);
      return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const packages: PackageType[] = Array.isArray(packagesData) ? packagesData : [];

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/api/packages/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      success('Paquete modificado exitosamente');
      setShowDeleteDialog(false);
      setPackageToDelete(null);
    },
    onError: (err: any) => {
      toastError(err?.response?.data?.error || 'Error al modificar el paquete');
    },
  });

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = packages.length;
    const active = packages.filter((p) => p.status === 'ACTIVE' || (p as any).isActive).length;
    const avgPrice = total > 0 ? (packages.reduce((sum, p) => sum + (Number(p.fixedPrice) || 0), 0) / total).toFixed(2) : '0.00';
    const totalServices = packages.reduce((sum, p) => sum + (p.services?.length || 0), 0);

    return {
      total,
      active,
      avgPrice,
      totalServices,
    };
  }, [packages]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Columns definition
  const columns = [
    {
      key: 'name',
      header: 'Paquete / Combo',
      render: (row: PackageType) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-unit bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-[var(--unit-text)] text-sm">{row.name}</span>
            <p className="text-[11px] text-[var(--unit-text-muted)] truncate max-w-xs">{row.description || 'Sin descripción'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'services',
      header: 'Servicios Incluidos',
      render: (row: PackageType) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 border border-purple-500/20">
          <Scissors className="h-3 w-3" />
          {row.services?.length || 0} servicios
        </span>
      ),
    },
    {
      key: 'duration',
      header: 'Duración Total',
      render: (row: PackageType) => (
        <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-[var(--unit-text)]">
          <Clock className="h-3.5 w-3.5 text-[var(--unit-accent)]" />
          {row.durationMin || 60} min
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Precio Combo (S/)',
      render: (row: PackageType) => (
        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
          S/ {Number(row.fixedPrice || 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row: PackageType) => {
        const isActive = row.status === 'ACTIVE' || (row as any).isActive;
        return (
          <TableBadge type={isActive ? 'status-active' : 'status-inactive'}>
            {isActive ? 'Activo' : 'Inactivo'}
          </TableBadge>
        );
      },
    },
  ];

  // Actions
  const actions = [
    {
      label: 'Ver Ficha',
      variant: 'view' as const,
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: PackageType) => {
        setSelectedPackage(row);
        setDrawerOpen(true);
      },
    },
    {
      label: 'Editar',
      variant: 'edit' as const,
      icon: <Edit className="h-4 w-4" />,
      onClick: (row: PackageType) => {
        router.push(`/packages/${row.id}/edit`);
      },
      disabled: () => !canEdit,
    },
    {
      label: 'Desactivar / Activar',
      variant: 'delete' as const,
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: PackageType) => {
        setPackageToDelete(row);
        setShowDeleteDialog(true);
      },
      disabled: () => !canEdit,
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--unit-surface)]">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Top Header & Fast Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--unit-border)]/40 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] text-xs font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--unit-accent)] animate-pulse" />
                Ofertas & Promociones • {activeUnit === 'BARBERIA' ? 'Barbería' : 'SPA'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--unit-text)] tracking-tight">
              Paquetes & Combos Especiales
            </h1>
            <p className="text-xs sm:text-sm text-[var(--unit-text-muted)]">
              Agrupación de múltiples servicios a precio cerrado con distribución de comisiones
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-xs font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-all shadow-unit-sm"
              title="Actualizar datos"
            >
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin text-[var(--unit-accent)]")} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            {canEdit && (
              <Link
                href="/packages/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-unit bg-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/90 text-white text-xs font-bold transition-all shadow-unit active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                Nuevo Paquete
              </Link>
            )}
          </div>
        </div>

        {/* Ergonomic Micro Status Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3">
            <div className="h-9 w-9 rounded-unit bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Total Paquetes</p>
              <p className="text-lg font-bold text-[var(--unit-text)]">{metrics.total}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3">
            <div className="h-9 w-9 rounded-unit bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Activos</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{metrics.active}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3">
            <div className="h-9 w-9 rounded-unit bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <Scissors className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Servicios Incluidos</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400 font-mono">{metrics.totalServices}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3">
            <div className="h-9 w-9 rounded-unit bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Precio Promedio</p>
              <p className="text-lg font-bold text-amber-600 font-mono">S/ {metrics.avgPrice}</p>
            </div>
          </div>
        </div>

        {/* View Switcher & Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Tab navigation pills */}
          <div className="flex items-center gap-1.5 p-1 bg-[var(--unit-surface-elevated)] rounded-unit-lg border border-[var(--unit-border)]/40 w-fit">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                'px-4 py-2 rounded-unit text-xs font-bold transition-all flex items-center gap-2',
                activeTab === 'all'
                  ? 'bg-[var(--unit-accent)] text-white shadow-unit-sm'
                  : 'text-[var(--unit-text-muted)] hover:text-[var(--unit-text)]'
              )}
            >
              <Package className="h-3.5 w-3.5" />
              Catálogo ({metrics.total})
            </button>

            <button
              onClick={() => setActiveTab('metrics')}
              className={cn(
                'px-4 py-2 rounded-unit text-xs font-bold transition-all flex items-center gap-2',
                activeTab === 'metrics'
                  ? 'bg-[var(--unit-accent)] text-white shadow-unit-sm'
                  : 'text-[var(--unit-text-muted)] hover:text-[var(--unit-text)]'
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              Métricas & Análisis
            </button>
          </div>

        </div>

        {/* Content Section */}
        {activeTab === 'metrics' ? (
          <div className="pt-2">
            <PackagesMetrics packages={packages} />
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-200">
            <TableToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por nombre o descripción de paquete..."
              chips={[
                { id: '', label: 'Todos' },
                { id: 'ACTIVE', label: 'Solo Activos' },
                { id: 'INACTIVE', label: 'Solo Inactivos' },
              ]}
              activeChip={statusFilter}
              onChipChange={(id) => setStatusFilter(id as string)}
            />
            
            <div className="rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] overflow-hidden shadow-unit-sm">
              <DataTable
                data={packages}
                columns={columns}
                actions={actions}
                keyExtractor={(row) => row.id}
                loading={isLoading}
                searchPlaceholder=""
                filters={[]}
                emptyMessage="No se encontraron paquetes registrados."
              />
            </div>
          </div>
        )}

        {/* Package Detail Drawer */}
        <PackageDetailDrawer
          pkg={selectedPackage}
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedPackage(null);
          }}
          onEdit={(p) => {
            setDrawerOpen(false);
            router.push(`/packages/${p.id}/edit`);
          }}
        />

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setPackageToDelete(null);
          }}
          onConfirm={() => {
            if (packageToDelete) {
              deleteMutation.mutate(packageToDelete.id);
            }
          }}
          title={(packageToDelete?.status === 'ACTIVE' || (packageToDelete as any)?.isActive) ? 'Desactivar Paquete' : 'Reactivar Paquete'}
          message={`¿Estás seguro de que deseas cambiar el estado del paquete "${packageToDelete?.name}"?`}
          confirmText="Confirmar"
          type="danger"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </div>
  );
}