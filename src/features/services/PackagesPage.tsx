import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Edit, Trash2, Plus, Clock, DollarSign, Package as PackageIcon, Tag, Eye, X, AlertCircle, Filter, Search, ChevronDown, ChevronUp, Activity, TrendingUp } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import type { Package } from '@/types/service';
import { PackagesMetrics } from './PackagesMetrics';

export function PackagesPage(): JSX.Element {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewModal, setViewModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  
  // Date range filter states (like services)
  const [dateFrom, setDateFrom] = useState<Date>(startOfDay(subDays(new Date(), 7)));
  const [dateTo, setDateTo] = useState<Date>(endOfDay(new Date()));
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(true);
  
  // Filter states
  const [priceRangeFilter, setPriceRangeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST';
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: packages, isLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: async (): Promise<Package[]> => {
      const { data } = await api.get<{ data: Package[] }>('/api/packages');
      return data.data; // Acceder al array dentro del objeto paginado
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
      setDeleteConfirm(null);
      alert('Paquete eliminado correctamente');
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
        setDeleteConfirm(row.id);
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

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl border-2 border-[var(--unit-border)] p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-[var(--unit-text-muted)] mb-4">
                Confirmar Eliminación
              </h3>
              <p className="text-[var(--unit-text-muted)] mb-6">
                ¿Estás seguro de que deseas eliminar este paquete? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-[var(--unit-accent)] bg-[var(--unit-surface)] rounded-lg hover:bg-[var(--unit-primary)] hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deleteMutation.mutate(deleteConfirm)}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {viewModal && selectedPackage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/15 to-blue-600/10">
                    <Eye className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Detalles del Paquete</h3>
                    <p className="text-sm text-gray-500">{selectedPackage.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewModal(false)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Información General</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-500">Nombre</span>
                      <span className="font-medium text-gray-900">{selectedPackage.name}</span>
                    </div>
                    {selectedPackage.description && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-sm text-gray-500">Descripción</span>
                        <span className="font-medium text-gray-900 max-w-xs truncate">{selectedPackage.description}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-500">Estado</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        selectedPackage.status === 'ACTIVE' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedPackage.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-500">Servicios Incluidos</span>
                      <span className="font-medium text-gray-900">{selectedPackage.services.length}</span>
                    </div>
                  </div>
                </div>

                {/* Pricing and Duration */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Precios y Duración</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-500">Precio Fijo</span>
                      <span className="font-semibold text-emerald-600">S/ {selectedPackage.fixedPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-500">Duración Total</span>
                      <span className="font-medium text-gray-900">{selectedPackage.durationMin} minutos</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-500">Precio por Minuto</span>
                      <span className="font-medium text-gray-900">
                        S/ {(selectedPackage.fixedPrice / selectedPackage.durationMin).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Services Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Servicios Incluidos</h4>
                <div className="space-y-3">
                  {selectedPackage.services.map((serviceItem, index) => (
                    <div key={serviceItem.serviceId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{serviceItem.service.name}</p>
                          {serviceItem.commissionShare && (
                            <p className="text-sm text-gray-500">Comisión: {serviceItem.commissionShare}%</p>
                          )}
                        </div>
                      </div>
                      <PackageIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Movements Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Movimientos Recientes</h4>
                {movements.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No hay movimientos registrados</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {movements.slice(0, 10).map((movement: any) => (
                      <div key={movement.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-gray-900">
                                {movement.type || 'Venta'}
                              </span>
                              <span className="text-sm text-gray-500">
                                {movement.date ? new Date(movement.date).toLocaleDateString('es-PE', { timeZone: 'America/Lima' }) : 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Cliente: {movement.customerName || 'No especificado'}</span>
                              <span>Precio: S/ {movement.price || selectedPackage.fixedPrice}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-emerald-600 tabular-nums">
                              S/ {(movement.price || selectedPackage.fixedPrice).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setViewModal(false)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
