'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Scissors, 
  Plus, 
  FolderPlus, 
  Clock, 
  DollarSign, 
  Tag, 
  Eye, 
  Edit, 
  Trash2, 
  Filter, 
  Search, 
  RefreshCw, 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Building2,
  Package
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useUnitStore } from '@/store/unitStore';
import { DataTable } from '@/components/ui/DataTable';
import { TableToolbar } from '@/components/ui/TableToolbar';
import { TableBadge } from '@/components/ui/TableBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ServiceDetailDrawer } from './ServiceDetailDrawer';
import { ServicesMetrics } from './ServicesMetrics';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import type { Service, ServiceCategory } from '@/types/service';

export function ServicesPage(): JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const activeUnit = useUnitStore((s) => s.activeUnit);
  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === 'ADMIN';
  const { success, error: toastError } = useToast();

  // Navigation tab: 'all' | 'categories' | 'metrics'
  const [activeTab, setActiveTab] = useState<'all' | 'categories' | 'metrics'>('all');

  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unitFilter, setUnitFilter] = useState<string>(activeUnit || '');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Sync unitFilter with activeUnit
  useEffect(() => {
    if (activeUnit) {
      setUnitFilter(activeUnit);
    }
  }, [activeUnit]);

  // Drawer and Dialog state
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Services Query
  const { 
    data: servicesData, 
    isLoading, 
    isFetching, 
    refetch 
  } = useQuery({
    queryKey: ['services', unitFilter, categoryId, debouncedSearch, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (unitFilter) params.set('unit', unitFilter);
      if (categoryId) params.set('categoryId', categoryId);
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter) params.set('isActive', statusFilter === 'active' ? 'true' : 'false');

      const { data } = await api.get(`/api/services?${params}`);
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });

  // Categories Query
  const { data: categories = [] } = useQuery<ServiceCategory[]>({
    queryKey: ['service-categories'],
    queryFn: async () => {
      const { data } = await api.get<ServiceCategory[]>('/api/services/categories');
      return data || [];
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/api/services/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      success('Estado del servicio actualizado');
      setShowDeleteDialog(false);
      setServiceToDelete(null);
    },
    onError: (err: any) => {
      toastError(err?.response?.data?.error || 'Error al modificar el servicio');
    },
  });

  const services: Service[] = Array.isArray(servicesData?.data) ? servicesData.data : Array.isArray(servicesData) ? servicesData : [];

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = services.length;
    const active = services.filter((s) => s.isActive).length;
    const avgDuration = total > 0 ? Math.round(services.reduce((sum, s) => sum + (s.durationMin || 30), 0) / total) : 0;
    const avgPrice = total > 0 ? (services.reduce((sum, s) => sum + Number(s.price || 0), 0) / total).toFixed(2) : '0.00';

    return {
      total,
      active,
      avgDuration,
      avgPrice,
    };
  }, [services]);

  const handleRefresh = useCallback(() => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['service-categories'] });
  }, [refetch, queryClient]);

  // Columns definition
  const columns = [
    {
      key: 'name',
      header: 'Servicio',
      render: (row: Service) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-unit bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] flex items-center justify-center shrink-0">
            <Scissors className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-[var(--unit-text)] text-sm">{row.name}</span>
            <p className="text-[11px] text-[var(--unit-text-muted)] truncate max-w-xs">{row.description || 'Sin descripción'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Categoría',
      render: (row: Service) => (
        <TableBadge type="status-default">
          {row.category?.name || 'General'}
        </TableBadge>
      ),
    },
    {
      key: 'unit',
      header: 'Unidad',
      render: (row: Service) => (
        <TableBadge type={row.unit === 'BARBERIA' ? 'unit-barberia' : 'unit-spa'}>
          {row.unit === 'BARBERIA' ? 'Barbería' : 'SPA'}
        </TableBadge>
      ),
    },
    {
      key: 'duration',
      header: 'Duración',
      render: (row: Service) => (
        <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-[var(--unit-text)]">
          <Clock className="h-3.5 w-3.5 text-[var(--unit-accent)]" />
          {row.durationMin || 30} min
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Precio (S/)',
      render: (row: Service) => (
        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
          S/ {Number(row.price || 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Estado',
      render: (row: Service) => (
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
      onClick: (row: Service) => {
        setSelectedServiceId(row.id);
        setDrawerOpen(true);
      },
    },
    {
      label: 'Editar',
      variant: 'edit' as const,
      icon: <Edit className="h-4 w-4" />,
      onClick: (row: Service) => {
        router.push(`/services/${row.id}/edit`);
      },
      disabled: () => !canEdit,
    },
    {
      label: 'Desactivar / Activar',
      variant: 'delete' as const,
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: Service) => {
        setServiceToDelete(row);
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
                Catálogo de Servicios • {activeUnit === 'BARBERIA' ? 'Barbería' : 'SPA'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--unit-text)] tracking-tight">
              Servicios & Procedimientos
            </h1>
            <p className="text-xs sm:text-sm text-[var(--unit-text-muted)]">
              Catálogo de atención profesional, comisiones y configuración de tiempos
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

            <Link
              href="/packages"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-xs font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-all shadow-unit-sm"
            >
              <Package className="h-4 w-4 text-purple-600" />
              <span className="hidden sm:inline">Paquetes</span>
            </Link>

            {canEdit && (
              <Link
                href="/services/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-unit bg-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/90 text-white text-xs font-bold transition-all shadow-unit active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                Nuevo Servicio
              </Link>
            )}
          </div>
        </div>

        {/* Ergonomic Micro Status Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3">
            <div className="h-9 w-9 rounded-unit bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <Scissors className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Total Servicios</p>
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
            <div className="h-9 w-9 rounded-unit bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Tiempo Promedio</p>
              <p className="text-lg font-bold text-[var(--unit-text)] font-mono">{metrics.avgDuration} min</p>
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
              <Scissors className="h-3.5 w-3.5" />
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
              <Sparkles className="h-3.5 w-3.5" />
              Métricas & Rendimiento
            </button>
          </div>

        </div>

        {/* Content Section */}
        {activeTab === 'metrics' ? (
          <div className="pt-2">
            <ServicesMetrics services={services} />
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-200">
            <TableToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por nombre de servicio o descripción..."
              chips={[
                { id: '', label: 'Todos' },
                { id: 'active', label: 'Solo Activos' },
                { id: 'inactive', label: 'Solo Inactivos' },
              ]}
              activeChip={statusFilter}
              onChipChange={(id) => setStatusFilter(id as string)}
              showAdvancedFiltersButton={true}
              isAdvancedOpen={showFilters}
              onToggleAdvanced={() => setShowFilters(!showFilters)}
              activeFiltersCount={categoryId ? 1 : 0}
              onResetFilters={() => setCategoryId('')}
              advancedFiltersContent={
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[var(--unit-text-muted)] uppercase">Categoría</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2 rounded-unit border border-[var(--unit-border)]/60 bg-[var(--unit-surface)] text-xs text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/40"
                    >
                      <option value="">Todas las categorías</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} ({cat.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              }
            />
            
            <div className="rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] overflow-hidden shadow-unit-sm">
              <DataTable
                data={services}
                columns={columns}
                actions={actions}
                keyExtractor={(row) => row.id}
                loading={isLoading}
                searchPlaceholder=""
                filters={[]}
                emptyMessage="No se encontraron servicios registrados para esta unidad o filtro."
              />
            </div>
          </div>
        )}

        {/* Service Detail Drawer */}
        <ServiceDetailDrawer
          serviceId={selectedServiceId}
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedServiceId(null);
          }}
          onEdit={(svc) => {
            setDrawerOpen(false);
            router.push(`/services/${svc.id}/edit`);
          }}
        />

        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setServiceToDelete(null);
          }}
          onConfirm={() => {
            if (serviceToDelete) {
              deleteMutation.mutate(serviceToDelete.id);
            }
          }}
          title={serviceToDelete?.isActive ? 'Desactivar Servicio' : 'Reactivar Servicio'}
          message={`¿Estás seguro de que deseas ${serviceToDelete?.isActive ? 'desactivar' : 'reactivar'} el servicio "${serviceToDelete?.name}"?`}
          confirmText={serviceToDelete?.isActive ? 'Desactivar' : 'Reactivar'}
          type={serviceToDelete?.isActive ? 'danger' : 'info'}
          isLoading={deleteMutation.isPending}
        />
      </div>
    </div>
  );
}
