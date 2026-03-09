'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Building2, Phone, Mail, MapPin, Plus, Edit, Trash2, Eye, X, AlertCircle, Filter, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '@/lib/api';
import { DataTable } from '@/components/ui/DataTable';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { SupplierMetrics } from '@/features/inventory/SupplierMetrics';

interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    stockEntries: number;
  };
}

export default function SuppliersPage() {
  const [showInactive, setShowInactive] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewModal, setViewModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  
  // Date range filter states (like inventory)
  const [dateFrom, setDateFrom] = useState<Date>(startOfDay(subDays(new Date(), 7)));
  const [dateTo, setDateTo] = useState<Date>(endOfDay(new Date()));
  const [showFilters, setShowFilters] = useState(true);
  
  // Filter states
  const [contactStatusFilter, setContactStatusFilter] = useState<string>('');
  const [addressStatusFilter, setAddressStatusFilter] = useState<string>('');
  
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST';

  // ✅ MEJORADO: Query con paginación y filtros reales
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const { data: suppliersData, isLoading } = useQuery({
    queryKey: ['suppliers', showInactive, currentPage, pageSize, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('activeOnly', (!showInactive).toString());
      params.set('page', currentPage.toString());
      params.set('limit', pageSize.toString());
      
      // Add date range filters
      if (dateFrom) params.set('dateFrom', dateFrom.toISOString());
      if (dateTo) params.set('dateTo', dateTo.toISOString());
      
      const { data } = await api.get(`/api/inventory/suppliers?${params}`);
      return data;
    },
  });

  // Extract data from paginated response
  const suppliers = suppliersData?.data || [];
  const pagination = suppliersData?.pagination || {
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  };

  // ✅ MEJORADO: Query para movimientos de proveedor con error handling
  const { data: movements = [], isLoading: movementsLoading } = useQuery({
    queryKey: ['supplier-movements', selectedSupplier?.id],
    queryFn: async () => {
      if (!selectedSupplier?.id) return [];
      const { data } = await api.get(`/api/inventory/suppliers/${selectedSupplier.id}/movements`);
      return data;
    },
    enabled: !!selectedSupplier?.id && viewModal,
    retry: false,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      await api.delete(`/api/inventory/suppliers/${supplierId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setDeleteConfirm(null);
    },
    onError: (error) => {
      console.error('Error deleting supplier:', error);
      alert('Error al eliminar el proveedor');
    },
  });

  const columns = [
    {
      key: 'name',
      header: 'Nombre',
      sortable: true,
      render: (row: Supplier) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-[var(--unit-text-muted)]" />
          <span className="font-medium text-[var(--unit-text-muted)]">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'contactName',
      header: 'Contacto',
      render: (row: Supplier) => row.contactName || '—',
    },
    {
      key: 'phone',
      header: 'Teléfono',
      render: (row: Supplier) => row.phone ? (
        <div className="flex items-center gap-1">
          <Phone className="h-3 w-3 text-[var(--unit-text-muted)]" />
          <span className="text-[var(--unit-text-muted)]">{row.phone}</span>
        </div>
      ) : '—',
    },
    {
      key: 'email',
      header: 'Email',
      render: (row: Supplier) => row.email ? (
        <div className="flex items-center gap-1">
          <Mail className="h-3 w-3 text-[var(--unit-text-muted)]" />
          <span className="text-sm text-[var(--unit-text-muted)]">{row.email}</span>
        </div>
      ) : '—',
    },
    {
      key: 'stockEntries',
      header: 'Compras',
      sortable: true,
      render: (row: Supplier) => (
        <span className="font-medium text-[var(--unit-text-muted)]">{row._count.stockEntries}</span>
      ),
    },
    {
      key: 'isActive',
      header: 'Estado',
      render: (row: Supplier) => (
        <span className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          row.isActive 
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        )}>
          {row.isActive ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Creado',
      sortable: true,
      render: (row: Supplier) => (
        <div className="text-sm text-[var(--unit-text-muted)]">
          {format(new Date(row.createdAt), "d MMM yyyy", { locale: es })}
        </div>
      ),
    },
  ];

  const filters = [
    {
      key: 'showInactive',
      label: 'Mostrar inactivos',
      type: 'checkbox' as const,
    },
    {
      key: 'hasContact',
      label: 'Con contacto',
      type: 'checkbox' as const,
    },
    {
      key: 'hasPhone',
      label: 'Con teléfono',
      type: 'checkbox' as const,
    },
    {
      key: 'hasEmail',
      label: 'Con email',
      type: 'checkbox' as const,
    },
    {
      key: 'hasAddress',
      label: 'Con dirección',
      type: 'checkbox' as const,
    },
  ];

  const actions = [
    {
      label: 'Ver',
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: Supplier) => {
        setSelectedSupplier(row);
        setViewModal(true);
      },
      className: 'text-blue-600 hover:bg-blue-50',
    },
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: (row: Supplier) => {
        router.push(`/suppliers/${row.id}/edit`);
      },
      className: 'text-amber-600 hover:bg-amber-50',
      disabled: (row: Supplier) => !canEdit,
    },
    {
      label: 'Eliminar',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: Supplier) => {
        if (row.isActive) {
          setDeleteConfirm(row.id);
        } else {
          // Reactivate inactive suppliers
          router.push(`/suppliers/${row.id}/edit`);
        }
      },
      className: 'text-red-600 hover:bg-red-50',
      disabled: (row: Supplier) => !canEdit,
    },
  ];

  // Apply filters to suppliers
  const filteredSuppliers = useMemo(() => {
    if (!suppliers) return [];

    return suppliers.filter((supplier: Supplier) => {
      // showInactive filter - only show active unless checked
      if (!supplier.isActive) {
        return false; // DataTable will handle this filter
      }

      return true; // DataTable will handle other filters
    });
  }, [suppliers]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--unit-surface)] via-[var(--unit-surface-elevated)] to-[var(--unit-surface)]">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto p-6">
        {/* Enhanced Header - Exacto estilo AppointmentsPage */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-4">
              <div className="h-2 w-2 rounded-full bg-[var(--unit-accent)] animate-pulse"></div>
              <span className="text-sm font-medium text-[var(--unit-text)]">
                Gestión de Proveedores
              </span>
            </div>
            <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">Proveedores</h1>
            <p className="text-[var(--unit-text-muted)]">
              Gestiona los proveedores de productos y servicios
            </p>
          </div>

          {/* Supplier Metrics - Nueva sección de métricas espectaculares */}
          <SupplierMetrics suppliers={suppliers || []} />

          {/* Enhanced Action Buttons - Exacto estilo AppointmentsPage */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {canEdit && (
              <button 
                className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white font-bold shadow-lg border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => router.push('/suppliers/new')}
              >
                <Plus className="h-5 w-5" />
                Nuevo Proveedor
              </button>
            )}
          </div>
        </div>

        {/* Enhanced Suppliers Filters - Exacto estilo AppointmentsPage */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6 mb-8">
          {/* Filter Header */}
          <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Filtros de Proveedores</h3>
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
                showUnitFilter={false}
                showStatusFilter={false}
                className="rounded-xl"
              />

              {/* Additional Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Estado</label>
                  <select
                    value={showInactive ? 'inactive' : 'active'}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                    onChange={(e) => setShowInactive(e.target.value === 'inactive')}
                  >
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                    <option value="all">Todos</option>
                  </select>
                </div>

                {/* Contact Status Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Contacto</label>
                  <select
                    value={contactStatusFilter}
                    onChange={(e) => setContactStatusFilter(e.target.value)}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                  >
                    <option value="">Todos los contactos</option>
                    <option value="hasPhone">Con teléfono</option>
                    <option value="hasEmail">Con email</option>
                    <option value="hasContact">Con teléfono o email</option>
                  </select>
                </div>

                {/* Address Status Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Dirección</label>
                  <select
                    value={addressStatusFilter}
                    onChange={(e) => setAddressStatusFilter(e.target.value)}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                  >
                    <option value="">Todas las direcciones</option>
                    <option value="hasAddress">Con dirección</option>
                    <option value="noAddress">Sin dirección</option>
                  </select>
                </div>
              </div>

              {/* Enhanced Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-[var(--unit-text-muted)]" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nombre, contacto, teléfono, email..."
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 pl-12 pr-12 py-4 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all placeholder:text-[var(--unit-text-muted)]/50"
                />
              </div>

              {/* Enhanced Active Filters Summary */}
              {(showInactive || contactStatusFilter || addressStatusFilter) && (
                <div className="rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Filtros activos:</span>
                      <div className="flex flex-wrap gap-2">
                        {showInactive && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 border border-red-200">
                            Estado: Inactivos
                          </span>
                        )}
                        {contactStatusFilter && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-200">
                            Contacto: {contactStatusFilter === 'hasPhone' ? 'Con teléfono' : contactStatusFilter === 'hasEmail' ? 'Con email' : 'Con teléfono o email'}
                          </span>
                        )}
                        {addressStatusFilter && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                            Dirección: {addressStatusFilter === 'hasAddress' ? 'Con dirección' : 'Sin dirección'}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowInactive(false);
                        setContactStatusFilter('');
                        setAddressStatusFilter('');
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

        {/* Enhanced Suppliers Table - Exacto estilo AppointmentsPage */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6">
          {/* Table Header */}
          <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Lista de Proveedores</h3>
                  <p className="text-sm text-[var(--unit-text-muted)]">Gestiona tus proveedores</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-[var(--unit-accent)]/20 px-3 py-1.5 text-sm font-bold text-[var(--unit-accent)] border border-[var(--unit-accent)]/30 shadow-sm">
                  {suppliers?.length || 0} proveedores
                </span>
              </div>
            </div>
          </div>

          {/* Enhanced Table */}
          <DataTable
            columns={columns}
            data={suppliers}
            keyExtractor={(row) => row.id}
            loading={isLoading}
            searchPlaceholder=""
            filters={[]}
            actions={actions}
            emptyMessage="No se encontraron proveedores con los filtros aplicados."
            pageSize={15}
            pageSizeOptions={[10, 15, 30, 50]}
            className="rounded-xl"
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
                ¿Estás seguro de que deseas eliminar este proveedor? Esta acción se puede deshacer activando el proveedor nuevamente.
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
        {viewModal && selectedSupplier && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/15 to-blue-600/10">
                    <Eye className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Detalles del Proveedor</h3>
                    <p className="text-sm text-gray-500">{selectedSupplier.name}</p>
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
                      <span className="font-medium text-gray-900">{selectedSupplier.name}</span>
                    </div>
                    {selectedSupplier.contactName && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-sm text-gray-500">Contacto</span>
                        <span className="font-medium text-gray-900">{selectedSupplier.contactName}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-500">Estado</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        selectedSupplier.isActive 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedSupplier.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-500">Fecha de Creación</span>
                      <span className="font-medium text-gray-900">
                        {new Date(selectedSupplier.createdAt).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Información de Contacto</h4>
                  <div className="space-y-3">
                    {selectedSupplier.phone && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-sm text-gray-500">Teléfono</span>
                        <span className="font-medium text-gray-900">{selectedSupplier.phone}</span>
                      </div>
                    )}
                    {selectedSupplier.email && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-sm text-gray-500">Email</span>
                        <span className="font-medium text-gray-900">{selectedSupplier.email}</span>
                      </div>
                    )}
                    {selectedSupplier.address && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-sm text-gray-500">Dirección</span>
                        <span className="font-medium text-gray-900">{selectedSupplier.address}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-500">Entradas de Stock</span>
                      <span className="font-medium text-gray-900">{selectedSupplier._count.stockEntries}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Movements Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Movimientos Recientes</h4>
                {movements.length === 0 ? (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No hay movimientos registrados</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {movements.slice(0, 10).map((movement: any) => (
                      <div key={movement.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Building2 className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-gray-900">
                                {movement.productName || 'Producto desconocido'}
                              </span>
                              <span className="text-sm text-gray-500">
                                {movement.quantity} {movement.unit || 'unidades'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Motivo: {movement.reason || 'Entrada de stock'}</span>
                              <span>
                                {new Date(movement.createdAt).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-emerald-600 tabular-nums">
                              +{movement.quantity}
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
