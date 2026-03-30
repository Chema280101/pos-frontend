'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Edit,
  Trash2,
  Users,
  AlertCircle,
  Loader2,
  X,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Calendar,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { cn } from '@/lib/utils';
import { SupplierMetrics } from './SupplierMetrics';
import { format } from 'date-fns';

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

export function SuppliersPage(): JSX.Element {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [viewModal, setViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Date range filter states (like appointments)
  const [dateFrom, setDateFrom] = useState<Date>(startOfDay(subDays(new Date(), 7)));
  const [dateTo, setDateTo] = useState<Date>(endOfDay(new Date()));
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(true);

  // Additional filters (like appointments)
  const [search, setSearch] = useState<string>('');
  
  // Debounce hook para búsqueda
  function useDebouncedValue<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
      const t = setTimeout(() => setDebounced(value), delay);
      return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
  }
  
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  
  // New filters for suppliers
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [contactFilter, setContactFilter] = useState<string>('');

  const user = useAuthStore((s: any) => s.user);
  const canEdit = user?.role === 'ADMIN'; // RECEPTIONIST can only view, not edit
  const router = useRouter();
  const queryClient = useQueryClient();

  // Enhanced query with pagination and filters (exacto estilo InventoryPage)
  const { data: suppliersData, isLoading } = useQuery({
    queryKey: ['suppliers', unitFilter, debouncedSearch, dateFrom, dateTo, statusFilter, contactFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // Add date range filters
      if (dateFrom) params.set('dateFrom', dateFrom.toISOString());
      if (dateTo) params.set('dateTo', dateTo.toISOString());
      
      // Add unit filter
      if (unitFilter) params.set('unit', unitFilter);
      
      // Add search filter
      if (debouncedSearch) params.set('search', debouncedSearch);
      
      // Add status filter
      if (statusFilter) params.set('isActive', statusFilter === 'active' ? 'true' : 'false');
      
      // Add contact filter
      if (contactFilter) params.set('contact', contactFilter);

      const { data } = await api.get(`/api/inventory/suppliers?${params}`);
      return data.data || data; // Handle paginated response
    },
  });

  // Extract data from paginated response
  const suppliers = suppliersData || [];

  // Delete mutation (exacto estilo InventoryPage)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/inventory/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setShowDeleteDialog(false);
      setSelectedSupplier(null);
      setDeleteConfirm(null);
    },
  });

  const handleDelete = useCallback((id: string) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  // Enhanced columns (exacto estilo InventoryPage)
  const columns = useMemo(() => [
    {
      key: 'name',
      header: 'Proveedor',
      sortable: true,
      render: (row: Supplier) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-[var(--unit-text-muted)]" />
          <span className="font-medium text-[var(--unit-text-muted)]">{row.name}</span>
          {!row.isActive && (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          )}
        </div>
      ),
    },
    {
      key: 'contactName',
      header: 'Contacto',
      render: (row: Supplier) => {
        const contactName = row.contactName || 'Sin contacto';
        
        if (contactName === 'Sin contacto') {
          return <span className="text-[var(--unit-text-muted)]">—</span>;
        }
        
        return (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-pink-100 text-pink-800">
            {contactName}
          </span>
        );
      },
    },
    {
      key: 'phone',
      header: 'Teléfono',
      render: (row: Supplier) => {
        const phone = row.phone || 'Sin teléfono';
        
        if (phone === 'Sin teléfono') {
          return <span className="text-[var(--unit-text-muted)]">—</span>;
        }
        
        return (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-sky-100 text-sky-800">
            {phone}
          </span>
        );
      },
    },
    {
      key: 'email',
      header: 'Email',
      render: (row: Supplier) => {
        const email = row.email || 'Sin email';
        
        if (email === 'Sin email') {
          return <span className="text-[var(--unit-text-muted)]">—</span>;
        }
        
        return (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-700">
            {email}
          </span>
        );
      },
    },
    {
      key: 'stockEntries',
      header: 'Entregas',
      sortable: true,
      render: (row: Supplier) => {
        const entries = row._count.stockEntries;
        
        return (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">
            {entries} entregas
          </span>
        );
      },
    },
  ], [canEdit, router]);

  // Actions for DataTable - Exacto estilo InventoryPage
  const actions = [
    {
      label: 'Ver',
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: Supplier) => {
        setSelectedSupplier(row);
        setViewModal(true);
      },
      className: 'text-[var(--unit-primary)] hover:bg-[var(--unit-primary)]/10',
    },
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: (row: Supplier) => {
        router.push(`/inventory/suppliers/${row.id}/edit`);
      },
      className: 'text-[var(--unit-warning)] hover:bg-[var(--unit-warning)]/10',
      disabled: (row: Supplier) => !canEdit,
    },
    {
      label: 'Eliminar',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: Supplier) => {
        setSelectedSupplier(row);
        setShowDeleteDialog(true);
        setDeleteConfirm(row.id);
      },
      className: 'text-[var(--unit-error)] hover:bg-[var(--unit-error)]/10',
      disabled: (row: Supplier) => !canEdit,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--unit-surface)] via-[var(--unit-surface-elevated)] to-[var(--unit-surface)]">
      {/* Background Pattern - Exacto estilo InventoryPage */}
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto p-6">
        {/* Enhanced Header - Exacto estilo InventoryPage */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-4">
              <div className="h-2 w-2 rounded-full bg-[var(--unit-accent)] animate-pulse"></div>
              <span className="text-sm font-medium text-[var(--unit-text)]">
                Sistema de Proveedores
              </span>
            </div>
            <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">Proveedores</h1>
            <p className="text-[var(--unit-text-muted)]">
              Gestiona tu red de proveedores con control total
            </p>
          </div>

          {/* Supplier Metrics - Nueva sección de métricas espectaculares */}
          <SupplierMetrics suppliers={suppliers} />

          {/* Enhanced Action Buttons - Solo Nuevo Proveedor */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {canEdit && (
              <Link href="/inventory/suppliers/new" className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white font-bold shadow-lg border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
                <Plus className="h-5 w-5" />
                Nuevo Proveedor
              </Link>
            )}
          </div>
        </div>

        {/* Enhanced Suppliers Filters - Exacto estilo InventoryPage */}
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

          {/* Filter Content - Conditional Rendering - Exacto estilo InventoryPage */}
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

              {/* Additional Filter Controls - Grid Layout como InventoryPage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Status Filter - Adaptado para Proveedores */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Estado</label>
                  <select
                    value={statusFilter}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">Todos los estados</option>
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                  </select>
                </div>

                {/* Contact Filter - Adaptado para Proveedores */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Tipo Contacto</label>
                  <select
                    value={contactFilter}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                    onChange={(e) => setContactFilter(e.target.value)}
                  >
                    <option value="">Todos los contactos</option>
                    <option value="phone">Con teléfono</option>
                    <option value="email">Con email</option>
                    <option value="both">Con teléfono y email</option>
                  </select>
                </div>

                {/* Search Bar - Exacto estilo InventoryPage */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Búsqueda</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-[var(--unit-text-muted)]" />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar por nombre de proveedor..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 pl-12 pr-12 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all placeholder:text-[var(--unit-text-muted)]/50"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--unit-accent)] text-white hover:bg-[var(--unit-accent)]/80 transition-colors">
                          <X className="h-3 w-3" />
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Active Filters Summary - Exacto estilo InventoryPage */}
              {(unitFilter || search || statusFilter || contactFilter) && (
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
                        {statusFilter && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700 border border-sky-200">
                            Estado: {statusFilter === 'active' ? 'Activos' : 'Inactivos'}
                          </span>
                        )}
                        {contactFilter && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 border border-purple-200">
                            Contacto: {contactFilter === 'phone' ? 'Con teléfono' : 
                                     contactFilter === 'email' ? 'Con email' : 
                                     contactFilter === 'both' ? 'Con teléfono y email' : contactFilter}
                          </span>
                        )}
                        {search && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                            Búsqueda: {search}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setUnitFilter('');
                        setSearch('');
                        setStatusFilter('');
                        setContactFilter('');
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

        {/* Suppliers Table - Exacto estilo InventoryPage */}
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
                  <p className="text-sm text-[var(--unit-text-muted)]">Gestiona tu red de proveedores</p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-[var(--unit-accent)]/20 px-3 py-1.5 text-sm font-bold text-[var(--unit-accent)] border border-[var(--unit-accent)]/30 shadow-sm">
                {suppliers.length} proveedores
              </span>
            </div>
          </div>

          {/* Table - Exacto estilo InventoryPage */}
          <DataTable
            columns={columns}
            data={suppliers}
            keyExtractor={(row) => row.id}
            loading={isLoading}
            searchPlaceholder="" // Hidden since we have custom search
            filters={[]} // Hidden since we have custom filters
            actions={actions}
            emptyMessage="No se encontraron proveedores con los filtros aplicados."
            pageSize={15}
            pageSizeOptions={[10, 15, 30, 50]}
            className="border-0 shadow-none"
          />
        </div>
      </div>

      {/* Delete Confirmation Modal - Exacto Estilo InventoryPage */}
      {showDeleteDialog && selectedSupplier && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowDeleteDialog(false);
            setSelectedSupplier(null);
            setDeleteConfirm(null);
          }
        }}>
          <div className="relative overflow-hidden rounded-2xl border-2 border-red-500/50 bg-gradient-to-br from-red-50/95 to-red-100/85 backdrop-blur-md shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <div className="h-full w-full bg-repeat" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23EF4444' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}></div>
            </div>
            
            <div className="relative">
              {/* Enhanced Header - Estándar consistente */}
              <div className="relative mb-6 flex items-start justify-between gap-4">
                {/* Background gradient for header - Consistente con Modal.tsx */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--unit-accent)]/20 to-transparent"></div>
                
                <div className="relative z-10 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-red-900">Eliminar Proveedor</h3>
                    <p className="text-sm text-red-700">Esta acción es permanente</p>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setSelectedSupplier(null);
                    setDeleteConfirm(null);
                  }}
                  className="relative z-10 shrink-0 rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)]/50 p-2 text-[var(--unit-text-muted)] transition-all duration-200 hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10 hover:text-[var(--unit-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Enhanced Content */}
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar Proveedor?</h4>
                  <p className="text-gray-600 mb-6">
                    Estás a punto de eliminar <span className="font-bold text-red-600">{selectedSupplier.name}</span>. 
                    Esta acción eliminará permanentemente el proveedor y toda su información asociada.
                  </p>
                </div>

                {/* Enhanced Supplier Info */}
                <div className="rounded-xl border-2 border-red-200/50 bg-red-50/50 p-4">
                  <h5 className="text-sm font-bold text-red-800 mb-3">Información del Proveedor:</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nombre:</span>
                      <span className="font-medium text-gray-900">{selectedSupplier.name}</span>
                    </div>
                    {selectedSupplier.contactName && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contacto:</span>
                        <span className="font-medium text-gray-900">{selectedSupplier.contactName}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Entregas:</span>
                      <span className="font-medium text-gray-900">{selectedSupplier._count.stockEntries}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estado:</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                        selectedSupplier.isActive 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {selectedSupplier.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enhanced Warning */}
                <div className="rounded-xl border-2 border-amber-200/50 bg-amber-50/50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="text-sm font-bold text-amber-800 mb-1">⚠️ Advertencia Importante</h5>
                      <p className="text-sm text-amber-700">
                        Al eliminar este proveedor, también se eliminarán todos los registros de entregas asociados. 
                        Esta acción afectará el historial de inventario y no podrá ser revertida.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Enhanced Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleDelete(selectedSupplier.id)}
                    disabled={deleteMutation.isPending || deleteConfirm !== selectedSupplier.id}
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
                  <button
                    onClick={() => {
                      setShowDeleteDialog(false);
                      setSelectedSupplier(null);
                      setDeleteConfirm(null);
                    }}
                    className="flex-1 rounded-xl border-2 border-red-300/50 px-6 py-3 text-sm font-medium text-red-700 bg-white/80 hover:bg-red-50 transition-all hover:shadow-lg active:scale-[0.98]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal - Exacto Estilo InventoryPage */}
      {viewModal && selectedSupplier && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Background Pattern - Exacto estilo InventoryPage */}
            <div className="absolute inset-0 opacity-5">
              <div className="h-full w-full bg-repeat" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}></div>
            </div>
              
            <div className="relative">
              {/* Enhanced Header - Exacto estilo InventoryPage */}
              <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-8 -mt-8 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                      <Eye className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--unit-text)]">Detalles del Proveedor</h3>
                      <p className="text-sm text-[var(--unit-text-muted)]">ID: {selectedSupplier.id}</p>
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

              {/* Enhanced Content Grid - Exacto estilo Servicio */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Enhanced General Information - Glassmorphism Card */}
                <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                  <div className="relative">
                    {/* Card Header */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                        <Building2 className="h-4 w-4 text-[var(--unit-accent)]" />
                      </div>
                      <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Información General</h4>
                    </div>

                    {/* Enhanced Supplier Info List */}
                    <div className="space-y-4">
                      {/* Name */}
                      <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[var(--unit-text)]">Nombre</span>
                        </div>
                        <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30 max-w-xs truncate">
                          {selectedSupplier.name}
                        </span>
                      </div>

                      {/* Contact Name */}
                      {selectedSupplier.contactName && (
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Contacto</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                            {selectedSupplier.contactName}
                          </span>
                        </div>
                      )}

                      {/* Phone */}
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

                      {/* Email */}
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

                      {/* Address */}
                      {selectedSupplier.address && (
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Dirección</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30 max-w-xs truncate">
                            {selectedSupplier.address}
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
                          selectedSupplier.isActive 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                            : 'bg-gray-100 text-gray-800 border-gray-200'
                        }`}>
                          {selectedSupplier.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Stock Information - Glassmorphism Card */}
                <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                  <div className="relative">
                    {/* Card Header */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                        <Package className="h-4 w-4 text-[var(--unit-accent)]" />
                      </div>
                      <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Información de Entregas</h4>
                    </div>

                    {/* Enhanced Stock List */}
                    <div className="space-y-4">
                      {/* Total Deliveries */}
                      <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 transition-all">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm font-bold text-emerald-800">Entregas Totales</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-800 bg-white px-3 py-1 rounded-lg border-2 border-emerald-300/30 shadow-lg tabular-nums">
                            {selectedSupplier._count.stockEntries}
                          </span>
                          <p className="text-xs text-emerald-700 font-medium mt-1">📦 Total de entregas</p>
                        </div>
                      </div>

                      {/* Created Date */}
                      <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border-2 border-amber-500/30 bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 transition-all">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-amber-600" />
                          <span className="text-sm font-bold text-amber-800">Fecha Creación</span>
                        </div>
                        <span className="font-bold text-amber-800 bg-white px-3 py-1 rounded-lg border-2 border-amber-300/30 shadow-lg tabular-nums">
                          {format(new Date(selectedSupplier.createdAt), 'dd/MM/yyyy')}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border-2 border-purple-500/30 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 transition-all">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-bold text-purple-800">Estado</span>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold border ${
                          selectedSupplier.isActive
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-red-100 text-red-700 border-red-200'
                        }`}>
                          {selectedSupplier.isActive ? (
                              <>
                                <CheckCircle className="h-3 w-3" />
                                Activo
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3" />
                                Inactivo
                              </>
                            )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Footer Actions - Exacto estilo Servicio */}
              <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-t border-[var(--unit-border)]/30 -mx-8 -mb-8 mt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                      <Building2 className="h-4 w-4 text-[var(--unit-accent)]" />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--unit-text-muted)]">Resumen del Proveedor</p>
                      <p className="text-sm font-bold text-[var(--unit-text)]">
                        {selectedSupplier.name} • {selectedSupplier._count.stockEntries} entregas • {selectedSupplier.isActive ? 'Activo' : 'Inactivo'}
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
  );
}

// Helper functions
function startOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

function endOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
}

function subDays(date: Date, days: number): Date {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() - days);
  return newDate;
}
