'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Edit, Trash2, Package, AlertTriangle, Plus, ArrowDownRight, ArrowUpRight, Eye, X, Home, AlertCircle, Filter, Search, DollarSign, Users, TrendingUp, TrendingDown, Calendar, Sparkles, BarChart3, Activity, ShoppingCart, Loader2, CheckCircle, Building2, Receipt, Clock, CreditCard, Wallet, Smartphone, ChevronDown, ChevronUp, Layers, Scissors, Tag } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { IncomesMetrics } from './IncomesMetrics';

interface Income {
  id: string;
  saleNumber: string;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  paymentDetail?: Record<string, number> | null;
  customer: {
    id: string;
    name: string;
  } | null;
  appointment?: {
    id: string;
    startTime: string;
  } | null;
  type?: 'SALE' | 'MANUAL_INCOME';
  // Enhanced fields for detailed income information
  itemsDetails?: Array<{
    name: string;
    type: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    employee: string;
  }>;
  summary?: string; // Quick display summary
  employees?: string[]; // All employees involved
  reason?: string; // For manual incomes
  category?: string; // For manual incomes
  // Legacy items (kept for compatibility)
  items?: Array<{
    id: string;
    itemType: string;
    referenceId: string;
    name: string;
    unitPrice: number;
    quantity: number;
    discountAmount: number;
    subtotal: number;
    employee?: {
      id: string;
      name: string;
    } | null;
    service?: {
      id: string;
      name: string;
    } | null;
    product?: {
      id: string;
      name: string;
    } | null;
    package?: {
      id: string;
      name: string;
    } | null;
  }> | null;
}

export function IncomePage(): JSX.Element {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewModal, setViewModal] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);

  // Success confirmation state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Date range filter states (como en appointments)
  const [dateFrom, setDateFrom] = useState<Date>(startOfDay(subDays(new Date(), 7)));
  const [dateTo, setDateTo] = useState<Date>(endOfDay(new Date()));
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(true);

  // Additional filters (como en appointments)
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
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
  const canEdit = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST';
  const router = useRouter();
  const queryClient = useQueryClient();

  // ✅ MEJORADO: Query con paginación real
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const { data: incomeData, isLoading } = useQuery({
    queryKey: ['income', unitFilter, currentPage, pageSize, dateFrom, dateTo, paymentMethodFilter, statusFilter, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (unitFilter) params.set('unit', unitFilter);
      params.set('page', String(currentPage));
      params.set('limit', String(pageSize));

      // Add date range filters
      if (dateFrom) params.set('dateFrom', dateFrom.toISOString());
      if (dateTo) params.set('dateTo', dateTo.toISOString());

      // Add payment method filter
      if (paymentMethodFilter) params.set('paymentMethod', paymentMethodFilter);

      // Add status filter
      if (statusFilter) params.set('status', statusFilter);

      // Add search filter
      if (debouncedSearch) params.set('search', debouncedSearch);

      const { data } = await api.get(`/api/income?${params}`);
      return data;
    },
  });

  // Extract data from paginated response
  const income = incomeData?.data || [];
  const pagination = incomeData?.pagination || {
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0,
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/api/income/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      setSuccessMessage('¡Ingreso eliminado exitosamente!');
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 2000);
      setDeleteConfirm(null);
    },
  });

  // Helper functions
  const getPaymentMethodIcon = useCallback((method: string) => {
    switch (method.toLowerCase()) {
      case 'efectivo':
        return <DollarSign className="h-4 w-4" />;
      case 'tarjeta':
        return <CreditCard className="h-4 w-4" />;
      case 'yape':
        return <Smartphone className="h-4 w-4" />;
      case 'transferencia':
        return <Wallet className="h-4 w-4" />;
      default:
        return <Receipt className="h-4 w-4" />;
    }
  }, []);

  const getPaymentMethodColor = useCallback((method: string) => {
    switch (method.toLowerCase()) {
      case 'efectivo':
        return 'bg-blue-100 text-blue-800';
      case 'tarjeta':
        return 'bg-purple-100 text-purple-800';
      case 'yape':
        return 'bg-cyan-100 text-cyan-800';
      case 'transferencia':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getUnitColor = useCallback((unit: string) => {
    return unit === 'SPA'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-amber-100 text-amber-800';
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
    render: (row: Income) => React.ReactNode;
  }> = [
      {
        key: 'saleNumber',
        header: 'Venta',
        sortable: true,
        render: (row: Income) => (
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-[var(--unit-text-muted)]" />
            <span className="font-medium text-[var(--unit-text-muted)]">#{row.saleNumber}</span>
          </div>
        ),
      },
      {
        key: 'details',
        header: 'Detalles',
        render: (row: Income) => (
          <div className="space-y-1">
            {row.type === 'SALE' ? (
              <>
                {/* Show items summary for sales */}
                {row.itemsDetails && row.itemsDetails.length > 0 ? (
                  <div className="space-y-1">
                    {row.itemsDetails.slice(0, 2).map((item, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        {/* Item type icon */}
                        {item.type === 'SERVICE' && <Scissors className="h-3 w-3 text-blue-500" />}
                        {item.type === 'PRODUCT' && <Package className="h-3 w-3 text-green-500" />}
                        {item.type === 'PACKAGE' && <Layers className="h-3 w-3 text-purple-500" />}

                        {/* Item name and quantity */}
                        <span className="text-[var(--unit-text)]">
                          {item.name}
                          {item.quantity > 1 && <span className="text-[var(--unit-text-muted)]"> (x{item.quantity})</span>}
                        </span>

                        {/* Employee name */}
                        {item.employee && (
                          <span className="text-[var(--unit-text-muted)]">
                            • {item.employee}
                          </span>
                        )}
                      </div>
                    ))}

                    {/* Show "more" indicator if there are more items */}
                    {row.itemsDetails.length > 2 && (
                      <span className="text-xs text-[var(--unit-text-muted)]">
                        +{row.itemsDetails.length - 2} más...
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-[var(--unit-text-muted)]">Sin detalles</span>
                )}
              </>
            ) : (
              /* Show reason for manual incomes */
              <div className="flex items-center gap-2">
                <DollarSign className="h-3 w-3 text-amber-500" />
                <span className="text-xs text-[var(--unit-text)]">{row.reason || 'Ingreso manual'}</span>
                {row.category && (
                  <span className="text-xs text-[var(--unit-text-muted)]">({row.category})</span>
                )}
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'customer',
        header: 'Cliente',
        render: (row: Income) => (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-pink-100 text-pink-800">
            {row.customer?.name || 'Sin cliente'}
          </span>
        ),
      },
      {
        key: 'total',
        header: 'Total',
        sortable: true,
        render: (row: Income) => (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 font-bold">
            S/ {row.total.toFixed(2)}
          </span>
        ),
      },
      {
        key: 'paymentMethod',
        header: 'Método de Pago',
        render: (row: Income) => (
          <span className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            getPaymentMethodColor(row.paymentMethod)
          )}>
            {row.paymentMethod}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Estado',
        render: (row: Income) => (
          <span className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            getStatusColor(row.status)
          )}>
            {row.status === 'completed' ? 'Completado' : 'Pendiente'}
          </span>
        ),
      },
      {
        key: 'createdAt',
        header: 'Fecha',
        sortable: true,
        render: (row: Income) => (
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
    onClick: (row: Income) => void;
    className: string;
    disabled?: (row: Income) => boolean;
  }> = [
      {
        label: 'Ver',
        icon: <Eye className="h-4 w-4" />,
        onClick: (row: Income) => {
          setSelectedIncome(row);
          setViewModal(true);
        },
        className: 'text-[var(--unit-primary)] hover:bg-[var(--unit-primary)]/10',
      },
      {
        label: 'Editar',
        icon: <Edit className="h-4 w-4" />,
        onClick: (row: Income) => {
          router.push(`/income/${row.id}/edit`);
        },
        className: 'text-[var(--unit-warning)] hover:bg-[var(--unit-warning)]/10',
        disabled: (row: Income) => !canEdit || row.status === 'completed',
      },
      {
        label: 'Eliminar',
        icon: <Trash2 className="h-4 w-4" />,
        onClick: (row: Income) => {
          setDeleteConfirm(row.id);
        },
        className: 'text-[var(--unit-error)] hover:bg-[var(--unit-error)]/10',
        disabled: (row: Income) => !canEdit || row.status === 'completed',
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
            <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">Ingresos</h1>
            <p className="text-[var(--unit-text-muted)]">
              Gestiona ventas e ingresos del negocio
            </p>
          </div>

          {/* Incomes Metrics - Nueva sección de métricas espectaculares */}
          <IncomesMetrics incomes={income} />

          {/* Enhanced Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <div className="text-center">
              <p className="text-sm text-[var(--unit-text-muted)]">
                Para registrar nuevos ingresos, utiliza la página de
                <Link href="/cash-register" className="font-bold text-[var(--unit-accent)] hover:underline ml-1">
                  Caja Registradora
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Income Filters */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6 mb-8">
          {/* Filter Header */}
          <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Filtros de Ingresos</h3>
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
                {/* Payment Method Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Método de Pago</label>
                  <select
                    value={paymentMethodFilter}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                    onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  >
                    <option value="">Todos los métodos</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="billetera">Billetera Digital</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="mixto">Mixto</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Estado</label>
                  <select
                    value={statusFilter}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">Todos los estados</option>
                    <option value="completed">Completado</option>
                    <option value="pending">Pendiente</option>
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
                      placeholder="Buscar por venta o cliente..."
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
            data={income}
            columns={columns as any}
            actions={actions as any}
            loading={isLoading}
            keyExtractor={(item: any) => item.id}
            emptyMessage="No hay ingresos con los filtros aplicados. Prueba ajustando los filtros o términos de búsqueda."
            disableInternalPagination={true}
            pagination={pagination}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="relative overflow-hidden rounded-2xl border-2 border-red-500/50 bg-gradient-to-br from-red-50/95 to-red-100/85 backdrop-blur-md shadow-2xl p-6 max-w-md w-full">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="h-full w-full bg-repeat" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23DC2626' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
              </div>

              <div className="relative">
                {/* Premium Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                      <Trash2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-red-900">Eliminar Ingreso</h3>
                      <p className="text-sm text-red-700">Esta acción no se puede deshacer</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 hover:bg-red-200 border-2 border-red-300/50 transition-all hover:scale-105"
                  >
                    <X className="h-4 w-4 text-red-600" />
                  </button>
                </div>

                {/* Warning Content */}
                <div className="space-y-6">
                  {/* Warning Card */}
                  <div className="relative overflow-hidden rounded-xl border-2 border-red-500/30 bg-gradient-to-br from-red-100 to-red-200 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20 mt-1">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900">
                          ¿Estás seguro de que deseas eliminar este ingreso?
                        </p>
                        <p className="text-xs text-red-700 mt-1">
                          Esta acción eliminará permanentemente el registro del ingreso y no se puede deshacer.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Income Details */}
                  <div className="relative overflow-hidden rounded-xl border-2 border-gray-500/30 bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Venta</span>
                        <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                          #{income.find((i: Income) => i.id === deleteConfirm)?.saleNumber || 'Venta'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Monto</span>
                        <span className="text-sm font-bold text-green-600">
                          S/ {income.find((i: Income) => i.id === deleteConfirm)?.total.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Premium Action Buttons */}
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={() => deleteMutation.mutate(deleteConfirm)}
                      disabled={deleteMutation.isPending}
                      className="flex-1 inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold shadow-lg border-2 border-red-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleteMutation.isPending ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                          Eliminando...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Eliminar Ingreso
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold border-2 border-gray-300/50 transition-all hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Details Modal - Same style as service modal */}
        {viewModal && selectedIncome && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="h-full w-full bg-repeat" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
              </div>

              <div className="relative">
                {/* Enhanced Header - Same as service modal */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                      <Eye className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[var(--unit-text)]">Detalles del Ingreso</h3>
                      <p className="text-sm text-[var(--unit-text-muted)]">#{selectedIncome.saleNumber}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewModal(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--unit-surface)] hover:bg-[var(--unit-surface-elevated)] border-2 border-[var(--unit-border)]/50 transition-all hover:scale-105"
                    aria-label="Cerrar"
                  >
                    <X className="h-4 w-4 text-[var(--unit-text-muted)] hover:text-[var(--unit-accent)] transition-colors" />
                  </button>
                </div>

                {/* Enhanced Content Grid - 3 columns like service modal */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Basic Information */}
                  <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                          <Receipt className="h-4 w-4 text-[var(--unit-accent)]" />
                        </div>
                        <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Información Básica</h4>
                      </div>

                      <div className="space-y-4">
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Venta</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                            #{selectedIncome.saleNumber}
                          </span>
                        </div>

                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Monto</span>
                          </div>
                          <span className="font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg border border-green-200">
                            S/ {selectedIncome.total.toFixed(2)}
                          </span>
                        </div>

                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Cliente</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                            {selectedIncome.customer?.name || 'Sin cliente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                          <CreditCard className="h-4 w-4 text-[var(--unit-accent)]" />
                        </div>
                        <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Información de Pago</h4>
                      </div>

                      <div className="space-y-4">
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(selectedIncome.paymentMethod)}
                            <span className="text-sm font-medium text-[var(--unit-text)]">Método</span>
                          </div>
                          <span className={cn(
                            'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border',
                            getPaymentMethodColor(selectedIncome.paymentMethod)
                          )}>
                            {selectedIncome.paymentMethod}
                          </span>
                        </div>

                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Estado</span>
                          </div>
                          <span className={cn(
                            'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border',
                            getStatusColor(selectedIncome.status)
                          )}>
                            {selectedIncome.status === 'completed' ? 'Completado' : 'Pendiente'}
                          </span>
                        </div>

                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Fecha</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                            {format(new Date(selectedIncome.createdAt), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Items Details for Sales - Same format as Movimientos Recientes */}
                  {selectedIncome.type === 'SALE' && selectedIncome.itemsDetails && selectedIncome.itemsDetails.length > 0 && (
                    <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                      <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                      <div className="relative">
                        {/* Card Header - Same as Movimientos Recientes */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                              <ShoppingCart className="h-4 w-4 text-[var(--unit-accent)]" />
                            </div>
                            <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">
                              Items de la Venta
                            </h4>
                          </div>
                          <span className="inline-flex items-center rounded-full bg-[var(--unit-accent)]/20 px-3 py-1.5 text-xs font-bold text-[var(--unit-accent)] border border-[var(--unit-accent)]/30 shadow-sm">
                            {selectedIncome.itemsDetails.length} items
                          </span>
                        </div>

                        {/* Enhanced Items List - Same format as movements */}
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                          {selectedIncome.itemsDetails.map((item, index) => (
                            <div key={index} className="group/item relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/20 bg-gradient-to-br from-white to-[var(--unit-surface)] p-4 hover:border-[var(--unit-accent)]/30 hover:shadow-lg transition-all duration-300">
                              <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover/item:opacity-100 transition-opacity rounded-xl"></div>
                              <div className="relative">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      {/* Item type icon */}
                                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] border border-[var(--unit-border)]/30">
                                        {item.type === 'SERVICE' && <Scissors className="h-3 w-3 text-blue-500" />}
                                        {item.type === 'PRODUCT' && <Package className="h-3 w-3 text-green-500" />}
                                        {item.type === 'PACKAGE' && <Layers className="h-3 w-3 text-purple-500" />}
                                      </div>
                                      <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-2 py-1 rounded-lg border border-[var(--unit-border)]/30">
                                        {item.name}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-[var(--unit-text-muted)] mb-2">
                                      <span>Cantidad: {item.quantity}</span>
                                      <span>Unitario: S/ {item.unitPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-[var(--unit-text-muted)]">
                                      <span>Subtotal: S/ {item.subtotal.toFixed(2)}</span>
                                      {item.employee && (
                                        <span>Realizado por: {item.employee}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                                      S/ {item.subtotal.toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Manual Income Details */}
                  {selectedIncome.type === 'MANUAL_INCOME' && (
                    <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                      <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                      <div className="relative">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                            <DollarSign className="h-4 w-4 text-[var(--unit-accent)]" />
                          </div>
                          <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Detalles del Ingreso Manual</h4>
                        </div>

                        <div className="space-y-4">
                          <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-[var(--unit-text-muted)]" />
                              <span className="text-sm font-medium text-[var(--unit-text)]">Motivo</span>
                            </div>
                            <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                              {selectedIncome.reason || 'Sin motivo'}
                            </span>
                          </div>

                          {selectedIncome.category && (
                            <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                              <div className="flex items-center gap-2">
                                <Tag className="h-4 w-4 text-[var(--unit-text-muted)]" />
                                <span className="text-sm font-medium text-[var(--unit-text)]">Categoría</span>
                              </div>
                              <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                                {selectedIncome.category}
                              </span>
                            </div>
                          )}

                          {selectedIncome.employees && selectedIncome.employees.length > 0 && (
                            <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-[var(--unit-text-muted)]" />
                                <span className="text-sm font-medium text-[var(--unit-text)]">Registrado por</span>
                              </div>
                              <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                                {selectedIncome.employees.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Detail for Mixed Payments */}
                  {selectedIncome.paymentMethod === 'Mixto' && selectedIncome.paymentDetail && (
                    <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                      <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                      <div className="relative">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                            <Layers className="h-4 w-4 text-[var(--unit-accent)]" />
                          </div>
                          <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Desglose de Pago</h4>
                        </div>

                        <div className="space-y-3">
                          {Object.entries(selectedIncome.paymentDetail)
                            .filter(([_, amount]) => amount > 0)
                            .map(([method, amount]) => (
                              <div key={method} className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                                <div className="flex items-center gap-2">
                                  {getPaymentMethodIcon(method)}
                                  <span className="text-sm font-medium text-[var(--unit-text)]">
                                    {method === 'CASH' ? 'Efectivo' :
                                      method === 'CARD' ? 'Tarjeta' :
                                        method === 'TRANSFER' ? 'Transferencia' :
                                          method === 'DIGITAL_WALLET' ? 'Billetera Digital' : method}
                                  </span>
                                </div>
                                <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                                  S/ {amount.toFixed(2)}
                                </span>
                              </div>
                            ))}

                          {/* Total Summary */}
                          <div className="mt-4 pt-4 border-t-2 border-[var(--unit-border)]/20">
                            <div className="flex justify-between items-center py-2 px-4 rounded-xl bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 border border-[var(--unit-accent)]/30">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-[var(--unit-accent)]" />
                                <span className="text-sm font-bold text-[var(--unit-text)]">Total Pagado</span>
                              </div>
                              <span className="font-bold text-[var(--unit-accent)] bg-white px-3 py-1 rounded-lg border border-[var(--unit-accent)]/30">
                                S/ {Object.values(selectedIncome.paymentDetail)
                                  .filter((amount) => amount > 0)
                                  .reduce((sum, amount) => sum + amount, 0)
                                  .toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Items Vendidos y Trabajadores */}
                  {selectedIncome.type === 'SALE' && selectedIncome.items && selectedIncome.items.length > 0 && (
                    <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                      <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                      <div className="relative">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                            <ShoppingCart className="h-4 w-4 text-[var(--unit-accent)]" />
                          </div>
                          <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Ítems Vendidos y Trabajadores</h4>
                        </div>

                        <div className="space-y-3">
                          {selectedIncome.items.map((item, index) => (
                            <div key={item.id} className="group/item flex justify-between items-start py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--unit-accent)]/10 border border-[var(--unit-accent)]/30">
                                    {item.itemType === 'SERVICE' && <Scissors className="h-3 w-3 text-[var(--unit-accent)]" />}
                                    {item.itemType === 'PRODUCT' && <Package className="h-3 w-3 text-[var(--unit-accent)]" />}
                                    {item.itemType === 'PACKAGE' && <Package className="h-3 w-3 text-[var(--unit-accent)]" />}
                                  </div>
                                  <span className="text-sm font-medium text-[var(--unit-text)]">
                                    {item.itemType === 'SERVICE' && 'Servicio'}
                                    {item.itemType === 'PRODUCT' && 'Producto'}
                                    {item.itemType === 'PACKAGE' && 'Paquete'}
                                  </span>
                                </div>

                                <div className="text-sm text-[var(--unit-text)] font-medium mb-1">
                                  {item.name}
                                </div>

                                <div className="flex items-center gap-4 text-xs text-[var(--unit-text-muted)]">
                                  <span>Cantidad: {item.quantity}</span>
                                  <span>Precio: S/ {item.unitPrice.toFixed(2)}</span>
                                  <span>Subtotal: S/ {item.subtotal.toFixed(2)}</span>
                                </div>

                                {item.employee && (
                                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[var(--unit-border)]/20">
                                    <Users className="h-4 w-4 text-[var(--unit-text-muted)]" />
                                    <span className="text-sm font-medium text-[var(--unit-text)]">
                                      {item.employee.name}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="text-right">
                                <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                                  S/ {item.subtotal.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}

                          {/* Resumen de ítems */}
                          <div className="mt-4 pt-4 border-t-2 border-[var(--unit-border)]/20">
                            <div className="flex justify-between items-center py-2 px-4 rounded-xl bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 border border-[var(--unit-accent)]/30">
                              <div className="flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4 text-[var(--unit-accent)]" />
                                <span className="text-sm font-bold text-[var(--unit-text)]">Total Ítems</span>
                              </div>
                              <span className="font-bold text-[var(--unit-accent)] bg-white px-3 py-1 rounded-lg border border-[var(--unit-accent)]/30">
                                S/ {selectedIncome.items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Footer Actions - Same as service modal */}
                <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-t border-[var(--unit-border)]/30 -mx-8 -mb-8 mt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                        <Eye className="h-4 w-4 text-[var(--unit-accent)]" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--unit-text-muted)]">Resumen del Ingreso</p>
                        <p className="text-sm font-bold text-[var(--unit-text)]">
                          {selectedIncome.type === 'SALE'
                            ? `Venta #${selectedIncome.saleNumber} - ${selectedIncome.itemsDetails?.length || 0} items - S/ ${selectedIncome.total.toFixed(2)}`
                            : `${selectedIncome.reason || 'Ingreso manual'} - S/ ${selectedIncome.total.toFixed(2)}`
                          }
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
      </div> {/* <-- ESTE ES EL DIV QUE FALTABA CERRAR */}
    </div>
  );
}