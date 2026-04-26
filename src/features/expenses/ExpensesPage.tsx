'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Edit, Trash2, Package, AlertTriangle, Plus, ArrowDownRight, ArrowUpRight, Eye, X, Home, AlertCircle, Filter, Search, DollarSign, Users, TrendingUp, TrendingDown, Calendar, Sparkles, BarChart3, Activity, ShoppingCart, Loader2, CheckCircle, Building2, Receipt, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { ExpensesMetrics } from './ExpensesMetrics';

interface Expense {
  id: string;
  amount: number;
  reason: string;
  category: string;
  createdAt: string;
  cashRegisterId: string;
  createdBy: {
    id: string;
    name: string;
  };
  cashRegister?: {
    id: string;
    unit: string;
    status: string;
  };
}

export function ExpensesPage(): JSX.Element {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewModal, setViewModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Date range filter states (como en appointments)
  const [dateFrom, setDateFrom] = useState<Date>(startOfDay(subDays(new Date(), 7)));
  const [dateTo, setDateTo] = useState<Date>(endOfDay(new Date()));
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(true);
  
  // Additional filters (como en appointments)
  const [categoryFilter, setCategoryFilter] = useState<string>('');
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
  
  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST' || user?.role === 'MANAGER';
  const router = useRouter();
  
  // ✅ Seguridad: Solo usar useQueryClient si estamos en el contexto correcto
  let queryClient: ReturnType<typeof useQueryClient> | undefined;
  try {
    queryClient = useQueryClient();
  } catch (error) {
    // QueryClient no disponible en este contexto
  }

  // ✅ MEJORADO: Query con paginación real
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [getAll, setGetAll] = useState(true); // ✅ Por defecto obtener todos los registros

  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['expenses', unitFilter, currentPage, pageSize, dateFrom, dateTo, categoryFilter, debouncedSearch, getAll],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (unitFilter) params.set('unit', unitFilter);
      params.set('page', String(currentPage));
      params.set('limit', String(pageSize));

      // Add date range filters
      if (dateFrom) params.set('dateFrom', dateFrom.toISOString());
      if (dateTo) params.set('dateTo', dateTo.toISOString());

      // Add category filter
      if (categoryFilter) params.set('category', categoryFilter);

      // Add search filter
      if (debouncedSearch) params.set('search', debouncedSearch);

      // Add getAll parameter
      if (getAll) params.set('getAll', 'true');

      const { data } = await api.get(`/api/expenses?${params}`);
      return data;
    },
  });

  // Extract data from paginated response
  const expenses = expensesData?.data || [];
  const pagination = expensesData?.pagination || {
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0,
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/api/expenses/${id}`);
      return data;
    },
    onSuccess: () => {
      if (queryClient) {
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
      }
      setShowDeleteDialog(false);
      setSelectedExpense(null);
    },
  });

  // Helper functions
  const getCategoryColor = useCallback((category: string) => {
    switch (category.toLowerCase()) {
      case 'servicios':
        return 'bg-blue-100 text-blue-800';
      case 'productos':
        return 'bg-green-100 text-green-800';
      case 'operativos':
        return 'bg-orange-100 text-orange-800';
      case 'administrativos':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-indigo-100 text-indigo-800';
    }
  }, []);

  const getUnitColor = useCallback((unit: string) => {
    return unit === 'SPA' 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-red-100 text-red-800';
  }, []);

  const getAmountRange = useCallback((amount: number) => {
    if (amount < 50) return '0-50';
    if (amount < 100) return '50-100';
    if (amount < 500) return '100-500';
    return '500+';
  }, []);

  const columns: Array<{
    key: string;
    header: string;
    sortable?: boolean;
    render: (row: Expense) => React.ReactNode;
  }> = [
    {
      key: 'reason',
      header: 'Concepto',
      sortable: true,
      render: (row: Expense) => (
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-[var(--unit-text-muted)]" />
          <span className="font-medium text-[var(--unit-text-muted)]">{row.reason}</span>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Categoría',
      sortable: true,
      render: (row: Expense) => (
        <span className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          getCategoryColor(row.category)
        )}>
          {row.category}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Monto',
      sortable: true,
      render: (row: Expense) => (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 font-bold">
          S/ {row.amount.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'unit',
      header: 'Unidad',
      render: (row: Expense) => (
        row.cashRegister && (
          <span className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            getUnitColor(row.cashRegister.unit)
          )}>
            {row.cashRegister.unit === 'SPA' ? 'SPA' : 'Barbería'}
          </span>
        )
      ),
    },
    {
      key: 'createdBy',
      header: 'Creado por',
      render: (row: Expense) => (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-pink-100 text-pink-800">
          {row.createdBy.name}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Fecha',
      sortable: true,
      render: (row: Expense) => (
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800">
            {format(new Date(row.createdAt), 'dd/MM/yyyy')}
          </span>
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-800">
            {format(new Date(row.createdAt), 'HH:mm')}
          </span>
        </div>
      ),
    },
  ];

  const actions: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: (row: Expense) => void;
    className: string;
    disabled?: (row: Expense) => boolean;
  }> = [
    {
      label: 'Ver',
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: Expense) => {
        setSelectedExpense(row);
        setViewModal(true);
      },
      className: 'text-[var(--unit-primary)] hover:bg-[var(--unit-primary)]/10',
    },
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: (row: Expense) => {
        router.push(`/expenses/${row.id}/edit`);
      },
      className: 'text-[var(--unit-warning)] hover:bg-[var(--unit-warning)]/10',
      disabled: (row: Expense) => !canEdit,
    },
    {
      label: 'Eliminar',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: Expense) => {
        setSelectedExpense(row);
        setShowDeleteDialog(true);
      },
      className: 'text-[var(--unit-error)] hover:bg-[var(--unit-error)]/10',
      disabled: (row: Expense) => !canEdit,
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
        {/* Enhanced Header - Idéntico a Appointments */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-4">
              <div className="h-2 w-2 rounded-full bg-[var(--unit-accent)] animate-pulse"></div>
              <span className="text-sm font-medium text-[var(--unit-text)]">
                Sistema de Gestión
              </span>
            </div>
            <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">Gastos</h1>
            <p className="text-[var(--unit-text-muted)]">
              Gestiona egresos y gastos operativos del negocio
            </p>
          </div>

          {/* Expenses Metrics - Nueva sección de métricas espectaculares */}
          <ExpensesMetrics expenses={expenses} />

          {/* Enhanced Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            {/* ✅ Botón "Nuevo Gasto" eliminado - usar flujo de Caja Registradora */}
            <div className="text-center">
              <p className="text-sm text-[var(--unit-text-muted)]">
                Para registrar nuevos egresos, utiliza la página de 
                <Link href="/cash-register" className="font-bold text-[var(--unit-accent)] hover:underline ml-1">
                  Caja Registradora
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Expenses Filters */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6 mb-8">
          {/* Filter Header */}
          <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Filtros de Gastos</h3>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Categoría</label>
                  <select
                    value={categoryFilter}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="">Todas las categorías</option>
                    <option value="other">Otros</option>
                    <option value="supplies">Insumos</option>
                    <option value="services">Servicios</option>
                    <option value="maintenance">Mantenimiento</option>
                    <option value="rent">Alquiler</option>
                    <option value="utilities">Servicios básicos</option>
                    <option value="marketing">Marketing</option>
                    <option value="office">Oficina</option>
                  </select>
                </div>

                {/* Search Bar */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Búsqueda</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-[var(--unit-text-muted)]" />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar por concepto..."
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
                        <X className="h-4 w-4 text-[var(--unit-text-muted)] hover:text-[var(--unit-text)]" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced DataTable with Glassmorphism */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl">
          <DataTable
            data={expenses}
            columns={columns as any}
            actions={actions as any}
            loading={isLoading}
            keyExtractor={(item: any) => item.id}
            emptyMessage="No hay gastos con los filtros aplicados. Prueba ajustando los filtros o términos de búsqueda."
            disableInternalPagination={true}
            pagination={pagination}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>

        {/* Delete Confirmation Modal - Estilo Original Premium */}
        {showDeleteDialog && selectedExpense && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteDialog(false);
              setSelectedExpense(null);
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
                  <h3 className="text-xl font-bold text-red-900">Eliminar Gasto</h3>
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
                        ¿Estás seguro de que deseas eliminar el gasto "{selectedExpense.reason}" por S/ {selectedExpense.amount.toFixed(2)}?
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        Esta acción eliminará permanentemente el registro del gasto y no se puede deshacer.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expense Info */}
                <div className="rounded-xl border-2 border-red-200/30 bg-gradient-to-br from-white/50 to-white/30 p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Motivo</span>
                      <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                        {selectedExpense.reason}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Monto</span>
                      <span className="text-sm font-bold text-gray-900">
                        S/ {selectedExpense.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Categoría</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedExpense.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Fecha</span>
                      <span className="text-sm font-medium text-gray-900">
                        {format(new Date(selectedExpense.createdAt), 'dd/MM/yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => {
                    deleteMutation.mutate(selectedExpense.id);
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
                      Eliminar Gasto
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setSelectedExpense(null);
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
        {viewModal && selectedExpense && (
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
                        <Eye className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[var(--unit-text)]">Detalles del Gasto</h3>
                        <p className="text-sm text-[var(--unit-text-muted)]">ID: {selectedExpense.id}</p>
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
                          <Receipt className="h-4 w-4 text-[var(--unit-accent)]" />
                        </div>
                        <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Información General</h4>
                      </div>

                      {/* Enhanced Expense Info List */}
                      <div className="space-y-4">
                        {/* Reason */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Concepto</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                            {selectedExpense.reason}
                          </span>
                        </div>

                        {/* Amount */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Monto</span>
                          </div>
                          <span className="font-bold text-red-600 bg-red-50 px-3 py-1 rounded-lg border border-red-200">
                            S/ {selectedExpense.amount.toFixed(2)}
                          </span>
                        </div>

                        {/* Category */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Categoría</span>
                          </div>
                          <span className={cn(
                            'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border',
                            getCategoryColor(selectedExpense.category)
                          )}>
                            {selectedExpense.category}
                          </span>
                        </div>

                        {/* Date */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Fecha</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                            {new Date(selectedExpense.createdAt).toLocaleDateString('es-PE')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced System Information - Glassmorphism Card */}
                  <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                    <div className="relative">
                      {/* Card Header */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                          <Activity className="h-4 w-4 text-[var(--unit-accent)]" />
                        </div>
                        <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Información del Sistema</h4>
                      </div>

                      {/* Enhanced System Info List */}
                      <div className="space-y-4">
                        {/* Created By */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Creado por</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                            {selectedExpense.createdBy.name}
                          </span>
                        </div>

                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Fecha</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                            {new Date(selectedExpense.createdAt).toLocaleString('es-PE')}
                          </span>
                        </div>

                        {selectedExpense.cashRegister && (
                          <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-[var(--unit-text-muted)]" />
                              <span className="text-sm font-medium text-[var(--unit-text)]">Unidad</span>
                            </div>
                            <span className={cn(
                              'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border',
                              getUnitColor(selectedExpense.cashRegister.unit)
                            )}>
                              {selectedExpense.cashRegister.unit === 'SPA' ? 'SPA' : 'Barbería'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Action Buttons - Exacto estilo Producto */}
                <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-t border-[var(--unit-border)]/30 -mx-8 -mb-8 mt-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                        <CheckCircle className="h-4 w-4 text-[var(--unit-accent)]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[var(--unit-text)]">Acciones Disponibles</h4>
                        <p className="text-xs text-[var(--unit-text-muted)]">Gestiona este gasto</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {canEdit && (
                        <button
                          onClick={() => {
                            router.push(`/expenses/${selectedExpense.id}/edit`);
                            setViewModal(false);
                          }}
                          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white font-bold shadow-lg border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <Edit className="h-4 w-4" />
                          Editar
                        </button>
                      )}
                      <button
                        onClick={() => setViewModal(false)}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold border-2 border-gray-300/50 transition-all hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <X className="h-4 w-4" />
                        Cerrar Detalles
                      </button>
                    </div>
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
