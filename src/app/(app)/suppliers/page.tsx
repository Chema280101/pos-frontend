'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Building2, Phone, Mail, MapPin, Plus, Edit, Trash2, Eye, X, AlertCircle, Filter, Search, ChevronDown, ChevronUp, Users, TrendingUp, Package, UserCheck, Calendar, CheckCircle, DollarSign, Clock } from 'lucide-react';
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [viewModal, setViewModal] = useState(false);

  // Date range filter states (like inventory)
  const [dateFrom, setDateFrom] = useState<Date>(startOfDay(subDays(new Date(), 7)));
  const [dateTo, setDateTo] = useState<Date>(endOfDay(new Date()));
  const [showFilters, setShowFilters] = useState(true);

  // Filter states
  const [contactStatusFilter, setContactStatusFilter] = useState<string>('');
  const [addressStatusFilter, setAddressStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('active');

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
      setShowDeleteDialog(false);
      setSelectedSupplier(null);
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
          setSelectedSupplier(row);
          setShowDeleteDialog(true);
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
      // Estado filter
      if (statusFilter === 'active' && !supplier.isActive) {
        return false;
      }
      if (statusFilter === 'inactive' && supplier.isActive) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesName = supplier.name.toLowerCase().includes(searchLower);
        const matchesContactName = supplier.contactName?.toLowerCase().includes(searchLower);
        const matchesPhone = supplier.phone?.toLowerCase().includes(searchLower);
        const matchesEmail = supplier.email?.toLowerCase().includes(searchLower);
        const matchesAddress = supplier.address?.toLowerCase().includes(searchLower);

        if (!matchesName && !matchesContactName && !matchesPhone && !matchesEmail && !matchesAddress) {
          return false;
        }
      }

      // Contacto filter
      if (contactStatusFilter) {
        const hasPhone = !!supplier.phone;
        const hasEmail = !!supplier.email;

        switch (contactStatusFilter) {
          case 'hasPhone':
            if (!hasPhone) return false;
            break;
          case 'hasEmail':
            if (!hasEmail) return false;
            break;
          case 'hasContact':
            if (!hasPhone && !hasEmail) return false;
            break;
          case 'noContact':
            if (hasPhone || hasEmail) return false;
            break;
        }
      }

      // Dirección filter
      if (addressStatusFilter) {
        const hasAddress = !!supplier.address;

        switch (addressStatusFilter) {
          case 'hasAddress':
            if (!hasAddress) return false;
            break;
          case 'noAddress':
            if (hasAddress) return false;
            break;
        }
      }

      return true;
    });
  }, [suppliers, statusFilter, contactStatusFilter, addressStatusFilter, searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--unit-surface)] via-[var(--unit-surface-elevated)] to-[var(--unit-surface)]">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto p-6">
        {/* Enhanced Header */}
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

          {/* Supplier Metrics */}
          <SupplierMetrics suppliers={suppliers || []} />

          {/* Enhanced Action Buttons */}
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

        {/* Enhanced Suppliers Filters - CAJA 1 */}
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
                    value={statusFilter}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                    onChange={(e) => setStatusFilter(e.target.value)}
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
                    <option value="noContact">Sin contacto</option>
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 pl-12 pr-12 py-4 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all placeholder:text-[var(--unit-text-muted)]/50"
                />
              </div>

              {/* Active Filters Summary */}
              {(statusFilter !== 'active' || contactStatusFilter || addressStatusFilter || searchTerm) && (
                <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 border border-[var(--unit-border)]/30">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Filtros activos:</span>
                      {statusFilter !== 'active' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--unit-accent)]/20 text-[var(--unit-accent)] text-xs font-medium border border-[var(--unit-accent)]/30">
                          Estado: {statusFilter === 'inactive' ? 'Inactivos' : 'Todos'}
                        </span>
                      )}
                      {contactStatusFilter && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium border border-blue-200">
                          Contacto: {
                            contactStatusFilter === 'hasPhone' ? 'Con teléfono' :
                            contactStatusFilter === 'hasEmail' ? 'Con email' :
                            contactStatusFilter === 'hasContact' ? 'Con teléfono o email' :
                            'Sin contacto'
                          }
                        </span>
                      )}
                      {addressStatusFilter && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium border border-green-200">
                          Dirección: {addressStatusFilter === 'hasAddress' ? 'Con dirección' : 'Sin dirección'}
                        </span>
                      )}
                      {searchTerm && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-medium border border-purple-200">
                          Búsqueda: "{searchTerm}"
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setStatusFilter('active');
                        setContactStatusFilter('');
                        setAddressStatusFilter('');
                        setSearchTerm('');
                      }}
                      className="text-xs font-medium text-[var(--unit-text-muted)] hover:text-[var(--unit-accent)] transition-colors"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                </div>
              )}
            </div>
          )} {/* AQUI CERRAMOS LOS FILTROS CORRECTAMENTE */}
        </div>

        {/* Enhanced Suppliers Table - CAJA 2 (AFUERA DE LOS FILTROS) */}
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
                  {filteredSuppliers?.length || 0} proveedores
                </span>
              </div>
            </div>
          </div>

          {/* Enhanced Table */}
          <DataTable
            columns={columns}
            data={filteredSuppliers}
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
        {showDeleteDialog && selectedSupplier && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteDialog(false);
              setSelectedSupplier(null);
            }
          }}>
            <div className="relative overflow-hidden rounded-2xl border-2 border-red-500/50 bg-gradient-to-br from-red-50/95 to-red-100/85 backdrop-blur-md shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="absolute inset-0 opacity-30 pointer-events-none">
                <div className="h-full w-full bg-repeat" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ef4444' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
              </div>

              <div className="relative flex items-center gap-4 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                  <Trash2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-900">Eliminar Proveedor</h3>
                  <p className="text-sm text-red-700">Esta acción no se puede deshacer</p>
                </div>
              </div>

              <div className="relative space-y-4">
                <div className="rounded-xl border-2 border-red-200/50 bg-gradient-to-br from-red-50 to-red-100 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 shadow-lg mt-1">
                      <AlertCircle className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-red-900">
                        ¿Estás seguro de que deseas eliminar el proveedor "{selectedSupplier.name}"?
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        Esta acción eliminará permanentemente el proveedor y toda su información asociada. No se podrá recuperar.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border-2 border-red-200/30 bg-gradient-to-br from-white/50 to-white/30 p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Proveedor</span>
                      <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{selectedSupplier.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Contacto</span>
                      <span className="text-sm font-medium text-gray-900">{selectedSupplier.contactName || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Teléfono</span>
                      <span className="text-sm font-medium text-gray-900">{selectedSupplier.phone || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Email</span>
                      <span className="text-sm font-medium text-gray-900">{selectedSupplier.email || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Entradas</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedSupplier._count?.stockEntries || 0} {(selectedSupplier._count?.stockEntries || 0) === 1 ? 'entrada' : 'entradas'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setSelectedSupplier(null);
                  }}
                  className="flex-1 rounded-xl border-2 border-red-300/50 px-6 py-3 text-sm font-medium text-red-700 bg-white/80 hover:bg-red-50 transition-all hover:shadow-lg active:scale-[0.98]"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deleteMutation.mutate(selectedSupplier.id)}
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
                      Eliminar Proveedor
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {viewModal && selectedSupplier && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="absolute inset-0 opacity-5">
                <div className="h-full w-full bg-repeat" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
              </div>

              <div className="relative">
                <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-8 -mt-8 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                        <Eye className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[var(--unit-text)]">Detalles del Proveedor</h3>
                        <p className="text-sm text-[var(--unit-text-muted)]">{selectedSupplier.name}</p>
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Basic Information */}
                  <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                          <Eye className="h-4 w-4 text-[var(--unit-accent)]" />
                        </div>
                        <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Información General</h4>
                      </div>
                      <div className="space-y-4">
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[var(--unit-text)]">Nombre</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30 max-w-xs truncate">
                            {selectedSupplier.name}
                          </span>
                        </div>
                        {selectedSupplier.contactName && (
                          <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-[var(--unit-text-muted)]" />
                              <span className="text-sm font-medium text-[var(--unit-text)]">Contacto</span>
                            </div>
                            <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30 max-w-xs truncate">
                              {selectedSupplier.contactName}
                            </span>
                          </div>
                        )}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Estado</span>
                          </div>
                          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold border ${selectedSupplier.isActive ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                            {selectedSupplier.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                          <Phone className="h-4 w-4 text-[var(--unit-accent)]" />
                        </div>
                        <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Información de Contacto</h4>
                      </div>
                      <div className="space-y-4">
                        {selectedSupplier.phone && (
                          <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-[var(--unit-text-muted)]" />
                              <span className="text-sm font-medium text-[var(--unit-text)]">Teléfono</span>
                            </div>
                            <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                              {selectedSupplier.phone}
                            </span>
                          </div>
                        )}
                        {selectedSupplier.email && (
                          <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-[var(--unit-text-muted)]" />
                              <span className="text-sm font-medium text-[var(--unit-text)]">Email</span>
                            </div>
                            <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30 max-w-xs truncate">
                              {selectedSupplier.email}
                            </span>
                          </div>
                        )}
                        {selectedSupplier.address && (
                          <div className="group/item flex justify-between items-start py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-[var(--unit-text-muted)]" />
                              <span className="text-sm font-medium text-[var(--unit-text)]">Dirección</span>
                            </div>
                            <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30 max-w-xs text-right">
                              {selectedSupplier.address}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                          <TrendingUp className="h-4 w-4 text-[var(--unit-accent)]" />
                        </div>
                        <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Estadísticas y Actividad</h4>
                      </div>
                      <div className="space-y-4">
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 transition-all">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm font-bold text-emerald-800">Entradas de Inventario</span>
                          </div>
                          <span className="font-bold text-emerald-800 bg-white px-3 py-1 rounded-lg border-2 border-emerald-300/30 shadow-lg">
                            {selectedSupplier._count?.stockEntries || 0}
                          </span>
                        </div>
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Fecha de Creación</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                            {new Date(selectedSupplier.createdAt).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}
                          </span>
                        </div>
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border-2 border-[var(--unit-primary)]/30 bg-gradient-to-r from-[var(--unit-primary)]/5 to-[var(--unit-accent)]/5 hover:from-[var(--unit-primary)]/10 hover:to-[var(--unit-accent)]/10 transition-all">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-[var(--unit-primary)]" />
                            <span className="text-sm font-bold text-[var(--unit-primary)]">Antigüedad</span>
                          </div>
                          <span className="font-bold text-[var(--unit-primary)] bg-white px-3 py-1 rounded-lg border-2 border-[var(--unit-primary)]/30 shadow-lg">
                            {Math.floor((new Date().getTime() - new Date(selectedSupplier.createdAt).getTime()) / (1000 * 60 * 60 * 24))} días
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-t border-[var(--unit-border)]/30 -mx-8 -mb-8 mt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                        <Eye className="h-4 w-4 text-[var(--unit-accent)]" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--unit-text-muted)]">Resumen del Proveedor</p>
                        <p className="text-sm font-bold text-[var(--unit-text)]">
                          {selectedSupplier.name} • {selectedSupplier._count?.stockEntries || 0} entradas • {selectedSupplier.isActive ? 'Activo' : 'Inactivo'}
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
