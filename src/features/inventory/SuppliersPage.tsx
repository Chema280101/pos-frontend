'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Building2, 
  Plus, 
  Search, 
  RefreshCw, 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronUp, 
  Phone, 
  Mail, 
  MapPin, 
  Eye, 
  Edit, 
  Trash2, 
  Package, 
  CheckCircle2, 
  XCircle, 
  Users, 
  ArrowUpRight 
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useUnitStore } from '@/store/unitStore';
import { DataTable } from '@/components/ui/DataTable';
import { TableToolbar } from '@/components/ui/TableToolbar';
import { TableBadge } from '@/components/ui/TableBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SupplierDetailDrawer, type SupplierRecord } from './SupplierDetailDrawer';
import { SupplierMetrics } from './SupplierMetrics';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

export function SuppliersPage(): JSX.Element {
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
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<SupplierRecord | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Suppliers Query
  const { 
    data: suppliersData, 
    isLoading, 
    isFetching, 
    refetch 
  } = useQuery({
    queryKey: ['suppliers', debouncedSearch, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter) params.set('isActive', statusFilter === 'active' ? 'true' : 'false');

      const { data } = await api.get(`/api/inventory/suppliers?${params}`);
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const suppliers: SupplierRecord[] = Array.isArray(suppliersData?.data)
    ? suppliersData.data
    : Array.isArray(suppliersData?.suppliers)
    ? suppliersData.suppliers
    : Array.isArray(suppliersData)
    ? suppliersData
    : [];

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/api/inventory/suppliers/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      success('Proveedor actualizado exitosamente');
      setShowDeleteDialog(false);
      setSupplierToDelete(null);
    },
    onError: (err: any) => {
      toastError(err?.response?.data?.error || 'Error al modificar el proveedor');
    },
  });

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = suppliers.length;
    const active = suppliers.filter((s) => s.isActive).length;
    const totalEntries = suppliers.reduce((sum, s) => sum + (s._count?.stockEntries || 0), 0);

    return {
      total,
      active,
      totalEntries,
    };
  }, [suppliers]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Columns definition
  const columns = [
    {
      key: 'name',
      header: 'Proveedor / Razón Social',
      render: (row: SupplierRecord) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-unit bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-[var(--unit-text)] text-sm">{row.name}</span>
            <p className="text-[11px] text-[var(--unit-text-muted)]">{row.contactName ? `Contacto: ${row.contactName}` : 'Sin contacto asignado'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Teléfono / Email',
      render: (row: SupplierRecord) => (
        <div className="flex flex-col text-xs font-mono">
          <span className="text-[var(--unit-text)]">{row.phone || '—'}</span>
          <span className="text-[11px] text-[var(--unit-text-muted)] font-sans">{row.email || '—'}</span>
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Dirección',
      render: (row: SupplierRecord) => (
        <span className="text-xs text-[var(--unit-text-muted)] truncate max-w-xs block">
          {row.address || '—'}
        </span>
      ),
    },
    {
      key: 'stockEntries',
      header: 'Entradas',
      render: (row: SupplierRecord) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
          <Package className="h-3 w-3" />
          {row._count?.stockEntries || 0}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Estado',
      render: (row: SupplierRecord) => (
        <TableBadge type={row.isActive ? 'status-active' : 'status-inactive'}>
          {row.isActive ? 'Activo' : 'Inactivo'}
        </TableBadge>
      ),
    },
  ];

  // Actions
  const actions = [
    {
      label: 'Ver Ficha',
      variant: 'view' as const,
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: SupplierRecord) => {
        setSelectedSupplier(row);
        setDrawerOpen(true);
      },
    },
    {
      label: 'Editar',
      variant: 'edit' as const,
      icon: <Edit className="h-4 w-4" />,
      onClick: (row: SupplierRecord) => {
        router.push(`/inventory/suppliers/${row.id}/edit`);
      },
      disabled: () => !canEdit,
    },
    {
      label: 'Desactivar / Activar',
      variant: 'delete' as const,
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: SupplierRecord) => {
        setSupplierToDelete(row);
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
                Cadena de Suministro • {activeUnit === 'BARBERIA' ? 'Barbería' : 'SPA'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--unit-text)] tracking-tight">
              Directorio de Proveedores
            </h1>
            <p className="text-xs sm:text-sm text-[var(--unit-text-muted)]">
              Gestión de casas comerciales, distribuidores y contactos de abastecimiento
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-xs font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-all shadow-unit"
              title="Actualizar datos"
            >
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin text-[var(--unit-accent)]")} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            {canEdit && (
              <Link
                href="/inventory/suppliers/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-unit bg-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/90 text-white text-xs font-bold transition-all shadow-unit active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                Nuevo Proveedor
              </Link>
            )}
          </div>
        </div>

        {/* Ergonomic Micro Status Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3">
            <div className="h-9 w-9 rounded-unit bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Total Proveedores</p>
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

          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="h-9 w-9 rounded-unit bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Entradas de Stock</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400 font-mono">{metrics.totalEntries}</p>
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
                  ? 'bg-[var(--unit-accent)] text-white shadow-unit'
                  : 'text-[var(--unit-text-muted)] hover:text-[var(--unit-text)]'
              )}
            >
              <Building2 className="h-3.5 w-3.5" />
              Directorio ({metrics.total})
            </button>

            <button
              onClick={() => setActiveTab('metrics')}
              className={cn(
                'px-4 py-2 rounded-unit text-xs font-bold transition-all flex items-center gap-2',
                activeTab === 'metrics'
                  ? 'bg-[var(--unit-accent)] text-white shadow-unit'
                  : 'text-[var(--unit-text-muted)] hover:text-[var(--unit-text)]'
              )}
            >
              <Users className="h-3.5 w-3.5" />
              Métricas & Análisis
            </button>
          </div>

        </div>

        {/* Content Section */}
        {activeTab === 'metrics' ? (
          <div className="pt-2">
            <SupplierMetrics suppliers={suppliers} />
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-200">
            <TableToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por nombre, contacto, teléfono..."
              chips={[
                { id: '', label: 'Todos' },
                { id: 'active', label: 'Solo Activos' },
                { id: 'inactive', label: 'Solo Inactivos' },
              ]}
              activeChip={statusFilter}
              onChipChange={(id) => setStatusFilter(id as string)}
            />
            
            <div className="rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] overflow-hidden shadow-unit">
              <DataTable
                data={suppliers}
                columns={columns}
                actions={actions}
                keyExtractor={(row) => row.id}
                loading={isLoading}
                searchPlaceholder=""
                filters={[]}
                emptyMessage="No se encontraron proveedores registrados."
              />
            </div>
          </div>
        )}

        {/* Supplier Detail Drawer */}
        <SupplierDetailDrawer
          supplier={selectedSupplier}
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedSupplier(null);
          }}
          onEdit={(s) => {
            setDrawerOpen(false);
            router.push(`/inventory/suppliers/${s.id}/edit`);
          }}
        />

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setSupplierToDelete(null);
          }}
          onConfirm={() => {
            if (supplierToDelete) {
              deleteMutation.mutate(supplierToDelete.id);
            }
          }}
          title={supplierToDelete?.isActive ? 'Desactivar Proveedor' : 'Reactivar Proveedor'}
          message={`¿Estás seguro de que deseas ${supplierToDelete?.isActive ? 'desactivar' : 'reactivar'} al proveedor "${supplierToDelete?.name}"?`}
          confirmText={supplierToDelete?.isActive ? 'Desactivar' : 'Reactivar'}
          type={supplierToDelete?.isActive ? 'danger' : 'info'}
          isLoading={deleteMutation.isPending}
        />
      </div>
    </div>
  );
}
