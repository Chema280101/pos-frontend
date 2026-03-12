import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
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
  ChevronDown,
  ChevronUp,
  Home,
  Package,
  Activity,
  AlertTriangle,
  Eye,
  ArrowUpRight,
  Calendar,
  CheckCircle,
  DollarSign,
} from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { SupplierMetrics } from './SupplierMetrics';

interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    stockEntries: number;
  };
}

export function SuppliersPage(): JSX.Element {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewModal, setViewModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Date range filter states (like appointments)
  const [dateFrom, setDateFrom] = useState<Date>(startOfDay(subDays(new Date(), 7)));
  const [dateTo, setDateTo] = useState<Date>(endOfDay(new Date()));
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(true);

  // Additional filters (like appointments)
  const [search, setSearch] = useState<string>('');
  
  // New filters for suppliers
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [contactFilter, setContactFilter] = useState<string>('');

  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === 'ADMIN'; // RECEPTIONIST can only view, not edit
  const router = useRouter();
  const queryClient = useQueryClient();

  // Enhanced query with pagination and filters (exacto estilo InventoryPage)
  const { data: suppliersData, isLoading } = useQuery({
    queryKey: ['suppliers', unitFilter, search, dateFrom, dateTo, statusFilter, contactFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (unitFilter) params.set('unit', unitFilter);
      if (search) params.set('search', search);
      if (dateFrom) params.set('dateFrom', dateFrom.toISOString());
      if (dateTo) params.set('dateTo', dateTo.toISOString());
      if (statusFilter) params.set('isActive', statusFilter === 'active' ? 'true' : 'false');
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
      const { data } = await api.delete(`/api/inventory/suppliers/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setShowDeleteDialog(false);
      setSelectedSupplier(null);
      setDeleteConfirm(null);
    },
  });

  const handleDelete = (id: string) => {
    setDeleteConfirm(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm);
    }
  };

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
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-sky-100 text-sky-700">
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
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700">
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
      className: 'text-blue-600 hover:bg-blue-50',
    },
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: (row: Supplier) => {
        router.push(`/inventory/suppliers/${row.id}/edit`);
      },
      className: 'text-amber-600 hover:bg-amber-50',
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
      className: 'text-red-600 hover:bg-red-50',
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

          {/* Enhanced Action Buttons - Idéntico a Appointments pero adaptado para Proveedores */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {canEdit && (
              <>
                <Link href="/inventory/suppliers/new" className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white font-bold shadow-lg border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
                  <Plus className="h-5 w-5" />
                  Nuevo Proveedor
                </Link>
                <Link href="/inventory/entry" className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg border-2 border-emerald-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
                  <ArrowUpRight className="h-5 w-5" />
                  Entrada de Stock
                </Link>
                <Link href="/inventory/movements" className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold shadow-lg border-2 border-purple-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
                  <Activity className="h-5 w-5" />
                  Movimientos
                </Link>
                <Link href="/inventory/alerts" className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold shadow-lg border-2 border-red-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
                  <AlertTriangle className="h-5 w-5" />
                  Alertas
                </Link>
                <Link href="/inventory/products" className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-lg border-2 border-blue-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
                  <Package className="h-5 w-5" />
                  Productos
                </Link>
                <button
                  onClick={() => router.push('/inventory/use')}
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold shadow-lg border-2 border-orange-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Home className="h-5 w-5" />
                  Uso Interno
                </button>
              </>
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
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ef4444' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}></div>
            </div>

            {/* Header */}
            <div className="relative flex items-center gap-4 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                <Trash2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-red-900">Eliminar Proveedor</h3>
                <p className="text-sm text-red-700">Esta acción no se puede deshacer</p>
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
                      ¿Estás seguro de que deseas eliminar el proveedor "{selectedSupplier.name}"?
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      Esta acción eliminará permanentemente el proveedor y todos sus datos asociados. No se podrá recuperar.
                    </p>
                  </div>
                </div>
              </div>

              {/* Supplier Info */}
              <div className="rounded-xl border-2 border-red-200/30 bg-gradient-to-br from-white/50 to-white/30 p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Proveedor</span>
                    <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                      {selectedSupplier.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Contacto</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedSupplier.contactName || 'Sin contacto'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Entregas</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedSupplier._count.stockEntries} realizadas
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Estado</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedSupplier.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={confirmDelete}
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

                      {/* Created Date */}
                      <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-[var(--unit-text-muted)]" />
                          <span className="text-sm font-medium text-[var(--unit-text)]">Fecha Creación</span>
                        </div>
                        <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                          {new Date(selectedSupplier.createdAt).toLocaleDateString('es-ES')}
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
                          {selectedSupplier.isActive ? '✅ Activo' : '❌ Inactivo'}
                        </span>
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
