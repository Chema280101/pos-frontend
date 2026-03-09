import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Edit, Trash2, Plus, Clock, DollarSign, Package as PackageIcon, Tag, Eye, X, AlertCircle, Filter, Search, ChevronDown, ChevronUp, Activity, TrendingUp, CheckCircle, Scissors } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import type { Package } from '@/types/service';
import { PackagesMetrics } from './PackagesMetrics';

export function PackagesPage(): JSX.Element {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewModal, setViewModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Date range filter states (like services)
  const [dateFrom, setDateFrom] = useState<Date>(startOfDay(subDays(new Date(), 7)));
  const [dateTo, setDateTo] = useState<Date>(endOfDay(new Date()));
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(true);
  
  // Filter states
  const [priceRangeFilter, setPriceRangeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === 'ADMIN'; // RECEPTIONIST can only view, not edit
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: packages, isLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: async (): Promise<Package[]> => {
      const { data } = await api.get<{ data: Package[] }>('/api/packages');
      // ✅ FIXED: Validar que data.data exista y sea un array
      return Array.isArray(data?.data) ? data.data : [];
    },
  });

  // Query for package movements
  const { data: movements = [] } = useQuery({
    queryKey: ['package-movements', selectedPackage?.id],
    queryFn: async () => {
      if (!selectedPackage?.id) return [];
      const { data } = await api.get(`/api/packages/${selectedPackage.id}/movements`);
      return data;
    },
    enabled: !!selectedPackage?.id && viewModal,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const { data } = await api.delete(`/api/packages/${packageId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      setShowDeleteDialog(false);
      setSelectedPackage(null);
    },
    onError: (error: any) => {
      console.error('Error deleting package:', error);
      alert(error.response?.data?.error || 'Error al eliminar el paquete');
    },
  });

  // Helper functions
  const getPriceRange = (price: number) => {
    const priceRanges = {
      '0-100': { min: 0, max: 100 },
      '100-200': { min: 100, max: 200 },
      '200-500': { min: 200, max: 500 },
      '500-1000': { min: 500, max: 1000 },
      '1000+': { min: 1000, max: Infinity }
    } as const;

    for (const [key, range] of Object.entries(priceRanges)) {
      if (price >= range.min && price < range.max) {
        return key;
      }
    }
    
    return '1000+';
  };

  const getDurationRange = (duration: number) => {
    const durationRanges = {
      '0-60': { min: 0, max: 60 },
      '60-120': { min: 60, max: 120 },
      '120-180': { min: 120, max: 180 },
      '180-240': { min: 180, max: 240 },
      '240+': { min: 240, max: Infinity }
    } as const;

    for (const [key, range] of Object.entries(durationRanges)) {
      if (duration >= range.min && duration < range.max) {
        return key;
      }
    }
    
    return '240+';
  };

  const getServiceCount = (pkg: Package) => pkg.services.length;

  const columns = [
    {
      key: 'name',
      header: 'Paquete',
      sortable: true,
      render: (row: Package) => (
        <div>
          <div className="flex items-center gap-2">
            <PackageIcon className="h-4 w-4 text-[var(--unit-text-muted)]" />
            <span className="font-medium text-[var(--unit-text-muted)]">{row.name}</span>
          </div>
          {row.description && (
            <div className="text-sm text-[var(--unit-text-muted)] mt-1">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'fixedPrice',
      header: 'Precio Fijo',
      sortable: true,
      render: (row: Package) => (
        <div className="flex items-center gap-1">
          <DollarSign className="h-3 w-3 text-[var(--unit-text-muted)]" />
          <span className="font-medium text-[var(--unit-text-muted)]">S/ {row.fixedPrice.toFixed(2)}</span>
        </div>
      ),
    },
    {
      key: 'durationMin',
      header: 'Duración',
      sortable: true,
      render: (row: Package) => (
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-[var(--unit-text-muted)]" />
          <span className="text-[var(--unit-text-muted)]">{row.durationMin} min</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row: Package) => (
        <span className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          row.status === 'ACTIVE'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        )}>
          {row.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'services',
      header: 'Servicios',
      sortable: true,
      render: (row: Package) => (
        <div className="flex items-center gap-1">
          <Tag className="h-3 w-3 text-[var(--unit-text-muted)]" />
          <span className="text-[var(--unit-text-muted)]">{getServiceCount(row)} servicios</span>
        </div>
      ),
    },
    {
      key: 'serviceList',
      header: 'Detalle de Servicios',
      render: (row: Package) => (
        <div className="max-w-xs">
          <div className="text-sm text-[var(--unit-text-muted)]">
            {row.services.map((s, index) => (
              <span key={s.serviceId}>
                {s.service.name}
                {index < row.services.length - 1 && ', '}
              </span>
            ))}
          </div>
        </div>
      ),
    },
  ];

  const actions = [
    {
      label: 'Ver',
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: Package) => {
        setSelectedPackage(row);
        setViewModal(true);
      },
      className: 'text-blue-600 hover:bg-blue-50',
    },
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: (row: Package) => {
        router.push(`/packages/${row.id}/edit`);
      },
      className: 'text-amber-600 hover:bg-amber-50',
      disabled: (row: Package) => !canEdit,
    },
    {
      label: 'Eliminar',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: Package) => {
        setSelectedPackage(row);
        setShowDeleteDialog(true);
      },
      className: 'text-red-600 hover:bg-red-50',
      disabled: (row: Package) => !canEdit,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--unit-surface)] via-[var(--unit-surface-elevated)] to-[var(--unit-surface)]">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto p-6">
        {/* Enhanced Header - Exacto estilo ServicesPage */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-4">
              <div className="h-2 w-2 rounded-full bg-[var(--unit-accent)] animate-pulse"></div>
              <span className="text-sm font-medium text-[var(--unit-text)]">
                Gestión de Paquetes
              </span>
            </div>
            <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">Paquetes / Combos</h1>
            <p className="text-[var(--unit-text-muted)]">
              Gestiona los paquetes y combos de servicios
            </p>
          </div>

          {/* Packages Metrics - Nueva sección de métricas espectaculares */}
          <PackagesMetrics packages={packages || []} />

          {/* Enhanced Action Buttons - Exacto estilo ServicesPage */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {canEdit && (
              <Link href="/packages/new" className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white font-bold shadow-lg border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
                <Plus className="h-5 w-5" />
                Nuevo Paquete
              </Link>
            )}
          </div>
        </div>

        {/* Enhanced Packages Filters - Exacto estilo ServicesPage */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6 mb-8">
          {/* Filter Header */}
          <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Filtros de Paquetes</h3>
                  <p className="text-sm text-[var(--unit-text-muted)]">Refina tu búsqueda</p>
                </div>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-[var(--unit-border)]/30 bg-[var(--unit-surface)] hover:bg-[var(--unit-surface-elevated)] transition-all"
              >
                {showFilters ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Ocultar filtros
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Mostrar filtros
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Filter Content - Conditional Rendering */}
          {showFilters && (
            <div className="space-y-6">
              {/* Date Range Filter */}
              <DateRangeFilter
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={(date: Date | null) => date && setDateFrom(date)}
                onDateToChange={(date: Date | null) => date && setDateTo(date)}
                unit={unitFilter}
                onUnitChange={setUnitFilter}
                showUnitFilter={true}
                showStatusFilter={false}
                className="rounded-xl"
              />

              {/* Additional Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                {/* Price Range Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Rango de Precio</label>
                  <select
                    value={priceRangeFilter}
                    onChange={(e) => setPriceRangeFilter(e.target.value)}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                  >
                    <option value="">Todos los precios</option>
                    <option value="0-100">S/ 0 - 100</option>
                    <option value="100-200">S/ 100 - 200</option>
                    <option value="200-500">S/ 200 - 500</option>
                    <option value="500+">S/ 500+</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Estado</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                  >
                    <option value="">Todos los estados</option>
                    <option value="ACTIVE">Activos</option>
                    <option value="INACTIVE">Inactivos</option>
                  </select>
                </div>
              </div>

              {/* Enhanced Active Filters Summary */}
              {(unitFilter || priceRangeFilter || statusFilter) && (
                <div className="rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Filtros activos:</span>
                      <div className="flex flex-wrap gap-2">
                        {unitFilter && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                            Unidad: {unitFilter}
                          </span>
                        )}
                        {priceRangeFilter && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-200">
                            Precio: {priceRangeFilter === '0-100' ? 'S/ 0 - 100' : priceRangeFilter === '100-200' ? 'S/ 100 - 200' : priceRangeFilter === '200-500' ? 'S/ 200 - 500' : 'S/ 500+'}
                          </span>
                        )}
                        {statusFilter && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 border border-purple-200">
                            Estado: {statusFilter === 'ACTIVE' ? 'Activos' : 'Inactivos'}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setUnitFilter('');
                        setPriceRangeFilter('');
                        setStatusFilter('');
                        setDateFrom(startOfDay(subDays(new Date(), 7)));
                        setDateTo(endOfDay(new Date()));
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--unit-accent)] hover:bg-[var(--unit-accent)] hover:text-white rounded-xl border-2 border-[var(--unit-accent)]/50 transition-all"
                    >
                      <X className="h-4 w-4" />
                      Limpiar filtros
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Packages Table - Exacto estilo ServicesPage */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6">
          {/* Table Header */}
          <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <PackageIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Lista de Paquetes</h3>
                  <p className="text-sm text-[var(--unit-text-muted)]">Gestiona tus paquetes y combos</p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-[var(--unit-accent)]/20 px-3 py-1.5 text-sm font-bold text-[var(--unit-accent)] border border-[var(--unit-accent)]/30 shadow-sm">
                {packages?.length || 0} paquetes
              </span>
            </div>
          </div>

          {/* Table */}
          <DataTable
            columns={columns}
            data={packages ?? []}
            keyExtractor={(row) => row.id}
            loading={isLoading}
            searchPlaceholder="" // Hidden since we have custom search
            filters={[]} // Hidden since we have custom filters
            actions={actions}
            emptyMessage="No se encontraron paquetes con los filtros aplicados."
            pageSize={15}
            pageSizeOptions={[10, 15, 30, 50]}
          />
        </div>

        {/* Delete Confirmation Modal - Estilo Original Premium */}
        {showDeleteDialog && selectedPackage && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteDialog(false);
              setSelectedPackage(null);
            }
          }}>
            <div className="relative overflow-hidden rounded-2xl border-2 border-red-500/50 bg-gradient-to-br from-red-50/95 to-red-100/85 backdrop-blur-md shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-30 pointer-events-none">
                <div className="h-full w-full bg-repeat" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ef4444' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
              </div>

              {/* Header */}
              <div className="relative flex items-center gap-4 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                  <Trash2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-900">Eliminar Paquete</h3>
                  <p className="text-sm text-red-700">Esta acción es permanente</p>
                </div>
              </div>

              {/* Content */}
              <div className="relative space-y-4">
                <div className="rounded-xl border-2 border-red-200/50 bg-gradient-to-br from-red-50 to-red-100 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 shadow-lg mt-1">
                      <AlertCircle className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-red-900">
                        ¿Estás seguro de que deseas eliminar el paquete "{selectedPackage.name}"?
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        Esta acción no se puede deshacer y el paquete será eliminado permanentemente del sistema.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Package Info */}
                <div className="rounded-xl border-2 border-red-200/30 bg-gradient-to-br from-white/50 to-white/30 p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Paquete</span>
                      <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                        {selectedPackage.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Precio</span>
                      <span className="text-sm font-bold text-gray-900">
                        S/ {selectedPackage.fixedPrice?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Servicios</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedPackage.services?.length || 0} servicios
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => {
                    deleteMutation.mutate(selectedPackage.id);
                  }}
                  disabled={deleteMutation.isPending}
                  className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold shadow-lg border-2 border-red-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                  {deleteMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                      Eliminando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Eliminar Paquete
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setSelectedPackage(null);
                  }}
                  className="flex-1 rounded-xl border-2 border-red-300/50 px-6 py-3 text-sm font-medium text-red-700 bg-white/80 hover:bg-red-50 transition-all hover:shadow-lg active:scale-[0.98]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Details Modal - Exacto Estilo Detalles de Producto */}
        {viewModal && selectedPackage && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              {/* Background Pattern - Exacto estilo Producto */}
              <div className="absolute inset-0 opacity-5">
                <div className="h-full w-full bg-repeat" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
              </div>
              
              <div className="relative">
                {/* Enhanced Header - Exacto estilo Producto */}
                <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-8 -mt-8 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                        <PackageIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[var(--unit-text)]">Detalles del Paquete</h3>
                        <p className="text-sm text-[var(--unit-text-muted)]">ID: {selectedPackage.id}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setViewModal(false)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-[var(--unit-border)]/30 bg-[var(--unit-surface)] hover:bg-[var(--unit-surface-elevated)] transition-all group"
                    >
                      <X className="h-4 w-4 text-[var(--unit-text-muted)] group-hover:text-[var(--unit-accent)] transition-colors" />
                    </button>
                  </div>
                </div>

                {/* Enhanced Content Grid - Exacto estilo Producto */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Enhanced General Information - Glassmorphism Card */}
                  <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                    <div className="relative">
                      {/* Card Header */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                          <PackageIcon className="h-4 w-4 text-[var(--unit-accent)]" />
                        </div>
                        <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Información General</h4>
                      </div>

                      {/* Enhanced Package Info List */}
                      <div className="space-y-4">
                        {/* Name */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[var(--unit-text)]">Nombre</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30 max-w-xs truncate">
                            {selectedPackage.name}
                          </span>
                        </div>

                        {/* Description */}
                        {selectedPackage.description && (
                          <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-[var(--unit-text)]">Descripción</span>
                            </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30 max-w-xs truncate">
                            {selectedPackage.description}
                          </span>
                        </div>
                        )}

                        {/* Status */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Estado</span>
                          </div>
                          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold border ${
                            selectedPackage.status === 'ACTIVE' 
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                              : 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {selectedPackage.status === 'ACTIVE' ? '✅ Activo' : '❌ Inactivo'}
                          </span>
                        </div>

                        {/* Services Count */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <Scissors className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Servicios Incluidos</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                            {selectedPackage.services.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Pricing and Duration - Glassmorphism Card */}
                  <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                    <div className="relative">
                      {/* Card Header */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                          <DollarSign className="h-4 w-4 text-[var(--unit-accent)]" />
                        </div>
                        <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Precios y Duración</h4>
                      </div>

                      {/* Enhanced Pricing List */}
                      <div className="space-y-4">
                        {/* Fixed Price */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border-2 border-green-500/30 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 transition-all">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-bold text-green-800">Precio Fijo</span>
                          </div>
                          <span className="font-bold text-green-800 bg-white px-3 py-1 rounded-lg border-2 border-green-300/30 shadow-lg tabular-nums">
                            S/ {selectedPackage.fixedPrice.toFixed(2)}
                          </span>
                        </div>

                        {/* Duration */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border-2 border-blue-500/30 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-bold text-blue-800">Duración Total</span>
                          </div>
                          <span className="font-bold text-blue-800 bg-white px-3 py-1 rounded-lg border-2 border-blue-300/30 shadow-lg tabular-nums">
                            {selectedPackage.durationMin} minutos
                          </span>
                        </div>

                        {/* Price per Minute */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border-2 border-purple-500/30 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 transition-all">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-bold text-purple-800">Precio por Minuto</span>
                          </div>
                          <span className="font-bold text-purple-800 bg-white px-3 py-1 rounded-lg border-2 border-purple-300/30 shadow-lg tabular-nums">
                            S/ {(selectedPackage.fixedPrice / selectedPackage.durationMin).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Services List - Glassmorphism Card */}
                  <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                    <div className="relative">
                      {/* Card Header */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                          <Scissors className="h-4 w-4 text-[var(--unit-accent)]" />
                        </div>
                        <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Servicios del Paquete</h4>
                      </div>

                      {/* Enhanced Services List */}
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {selectedPackage.services.map((serviceItem, index) => (
                          <div key={serviceItem.serviceId} className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                                <span className="text-xs font-bold text-[var(--unit-accent)]">{index + 1}</span>
                              </div>
                              <div>
                                <p className="font-medium text-[var(--unit-text)]">{serviceItem.service.name}</p>
                                {serviceItem.commissionShare && (
                                  <p className="text-xs text-[var(--unit-text-muted)]">Comisión: {serviceItem.commissionShare}%</p>
                                )}
                              </div>
                            </div>
                            <Scissors className="h-4 w-4 text-[var(--unit-text-muted)]" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Footer Actions - Exacto estilo Producto */}
                <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-t border-[var(--unit-border)]/30 -mx-8 -mb-8 mt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                        <PackageIcon className="h-4 w-4 text-[var(--unit-accent)]" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--unit-text-muted)]">Resumen del Paquete</p>
                        <p className="text-sm font-bold text-[var(--unit-text)]">
                          {selectedPackage.name} • {selectedPackage.services.length} servicios • {selectedPackage.durationMin} min
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setViewModal(false)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white font-bold shadow-lg border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Cerrar Detalles
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
