'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  TrendingUp, 
  TrendingDown,
  Filter, 
  Search, 
  DollarSign, 
  Calendar, 
  RefreshCw, 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  Trash2, 
  Edit, 
  Receipt, 
  Clock, 
  CreditCard,
  Banknote,
  Smartphone,
  ArrowRightLeft,
  CheckCircle2,
  Vault,
  Scissors
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useUnitStore } from '@/store/unitStore';
import { DataTable } from '@/components/ui/DataTable';
import { TableToolbar } from '@/components/ui/TableToolbar';
import { TableBadge } from '@/components/ui/TableBadge';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { IncomeDetailDrawer } from './IncomeDetailDrawer';
import { IncomesMetrics } from './IncomesMetrics';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

export function IncomePage(): JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const activeUnit = useUnitStore((s) => s.activeUnit);
  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST' || user?.role === 'MANAGER';
  const { success, error: toastError } = useToast();

  // Navigation tabs: 'all' | 'metrics'
  const [activeTab, setActiveTab] = useState<'all' | 'metrics'>('all');

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date>(startOfDay(subDays(new Date(), 7)));
  const [dateTo, setDateTo] = useState<Date>(endOfDay(new Date()));
  const [unitFilter, setUnitFilter] = useState<string>(activeUnit || '');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Sync unitFilter with activeUnit
  useEffect(() => {
    if (activeUnit) {
      setUnitFilter(activeUnit);
    }
  }, [activeUnit]);

  // Drawer and Dialog state
  const [selectedIncome, setSelectedIncome] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState<any | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Income Query
  const { 
    data: incomeData, 
    isLoading, 
    isFetching, 
    refetch 
  } = useQuery({
    queryKey: ['income', unitFilter, dateFrom, dateTo, paymentMethodFilter, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (unitFilter) params.set('unitFilter', unitFilter);
      if (dateFrom) params.set('dateFrom', dateFrom.toISOString());
      if (dateTo) params.set('dateTo', dateTo.toISOString());
      if (paymentMethodFilter) params.set('paymentMethod', paymentMethodFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);

      const { data } = await api.get(`/api/income?${params}`);
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const incomes: any[] = Array.isArray(incomeData?.data)
    ? incomeData.data
    : Array.isArray(incomeData?.incomes)
    ? incomeData.incomes
    : Array.isArray(incomeData)
    ? incomeData
    : [];

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/api/income/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-open'] });
      success('Ingreso eliminado exitosamente');
      setShowDeleteDialog(false);
      setIncomeToDelete(null);
    },
    onError: (err: any) => {
      toastError(err?.response?.data?.error || 'Error al eliminar el ingreso');
    },
  });

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalCount = incomes.length;
    const totalAmount = incomes.reduce((sum, i) => sum + (Number(i.total || i.amount) || 0), 0);
    const avgTicket = totalCount > 0 ? (totalAmount / totalCount).toFixed(2) : '0.00';

    return {
      totalCount,
      totalAmount: totalAmount.toFixed(2),
      avgTicket,
    };
  }, [incomes]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const getMethodBadge = (method: string) => {
    const m = (method || '').toUpperCase();
    if (m === 'CASH' || m === 'EFECTIVO') {
      return (
        <TableBadge type="payment-efectivo">
          <Banknote className="h-3 w-3 mr-1" />
          Efectivo
        </TableBadge>
      );
    }
    if (m === 'CARD' || m === 'TARJETA') {
      return (
        <TableBadge type="payment-card">
          <CreditCard className="h-3 w-3 mr-1" />
          Tarjeta
        </TableBadge>
      );
    }
    if (m === 'TRANSFER' || m === 'TRANSFERENCIA') {
      return (
        <TableBadge type="payment-transfer">
          <ArrowRightLeft className="h-3 w-3 mr-1" />
          Transferencia
        </TableBadge>
      );
    }
    return (
      <TableBadge type="payment-digital">
        <Smartphone className="h-3 w-3 mr-1" />
        Billetera Digital
      </TableBadge>
    );
  };

  // Columns definition
  const columns = [
    {
      key: 'saleNumber',
      header: 'Comprobante / Concepto',
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-unit bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-[var(--unit-text)] text-sm">
              {row.saleNumber ? `Venta #${row.saleNumber}` : (row.reason || 'Ingreso Manual')}
            </span>
            <p className="text-[11px] text-[var(--unit-text-muted)]">
              Cliente: <span className="font-semibold text-[var(--unit-text)]">{row.customer?.name || 'Cliente Ocasional'}</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Método de Pago',
      render: (row: any) => getMethodBadge(row.paymentMethod),
    },
    {
      key: 'createdAt',
      header: 'Fecha / Hora',
      render: (row: any) => (
        <span className="text-xs font-mono text-[var(--unit-text)] flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-[var(--unit-accent)]" />
          {row.createdAt ? format(new Date(row.createdAt), 'dd/MM/yyyy HH:mm', { locale: es }) : 'N/A'}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Monto (S/)',
      render: (row: any) => (
        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
          + S/ {Number(row.total || row.amount || 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row: any) => (
        <TableBadge type="status-active">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {row.status === 'completed' ? 'Completado' : row.status || 'Cobrado'}
        </TableBadge>
      ),
    },
  ];

  // Actions
  const actions = [
    {
      label: 'Ver Comprobante',
      variant: 'view' as const,
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: any) => {
        setSelectedIncome(row);
        setDrawerOpen(true);
      },
    },
    {
      label: 'Eliminar',
      variant: 'delete' as const,
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: any) => {
        setIncomeToDelete(row);
        setShowDeleteDialog(true);
      },
      disabled: (row: any) => !canEdit || row.status === 'completed',
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
                Control de Ingresos • {activeUnit === 'BARBERIA' ? 'Barbería' : 'SPA'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--unit-text)] tracking-tight">
              Ingresos & Recaudaciones
            </h1>
            <p className="text-xs sm:text-sm text-[var(--unit-text-muted)]">
              Auditoría y registro de cobros por servicios, venta de retail e ingresos manuales
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
              href="/cash-register"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-unit bg-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/90 text-white text-xs font-bold transition-all shadow-unit active:scale-[0.98]"
            >
              <Vault className="h-4 w-4" />
              Ir a Caja Registradora
            </Link>
          </div>
        </div>

        {/* Ergonomic Micro Status Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3">
            <div className="h-9 w-9 rounded-unit bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Transacciones</p>
              <p className="text-lg font-bold text-[var(--unit-text)]">{metrics.totalCount}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3">
            <div className="h-9 w-9 rounded-unit bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Recaudación Total</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">S/ {metrics.totalAmount}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="h-9 w-9 rounded-unit bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Ticket Promedio</p>
              <p className="text-lg font-bold text-amber-600 font-mono">S/ {metrics.avgTicket}</p>
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
              <TrendingUp className="h-3.5 w-3.5" />
              Listado de Ingresos ({metrics.totalCount})
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
              <DollarSign className="h-3.5 w-3.5" />
              Métricas & Análisis
            </button>
          </div>

        </div>

        {/* Content Section */}
        {activeTab === 'metrics' ? (
          <div className="pt-2">
            <IncomesMetrics incomes={incomes} totalAmount={incomeData?.totalAmount} aggregatedMetrics={incomeData?.aggregatedMetrics} />
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-200">
            <TableToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por número de venta o cliente..."
              chips={[
                { id: '', label: 'Todas las unidades' },
                { id: 'BARBERIA', label: 'Barbería' },
                { id: 'SPA', label: 'SPA' },
              ]}
              activeChip={unitFilter}
              onChipChange={(id) => setUnitFilter(id as string)}
              showAdvancedFiltersButton={true}
              isAdvancedOpen={showFilters}
              onToggleAdvanced={() => setShowFilters(!showFilters)}
              activeFiltersCount={(paymentMethodFilter ? 1 : 0) + (dateFrom ? 1 : 0)}
              onResetFilters={() => {
                setPaymentMethodFilter('');
                setUnitFilter('');
              }}
              advancedFiltersContent={
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Payment Method Filter */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[var(--unit-text-muted)] uppercase">Método de Pago</label>
                      <select
                        value={paymentMethodFilter}
                        onChange={(e) => setPaymentMethodFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-unit border border-[var(--unit-border)]/60 bg-[var(--unit-surface)] text-xs text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/40"
                      >
                        <option value="">Todos los métodos</option>
                        <option value="CASH">Efectivo</option>
                        <option value="CARD">Tarjeta</option>
                        <option value="TRANSFER">Transferencia</option>
                        <option value="DIGITAL_WALLET">Billetera Digital</option>
                      </select>
                    </div>
                  </div>

                  {/* Date Range Picker */}
                  <div className="pt-2 border-t border-[var(--unit-border)]/20">
                    <DateRangeFilter
                      dateFrom={dateFrom}
                      dateTo={dateTo}
                      onDateFromChange={(date: Date | null) => date && setDateFrom(date)}
                      onDateToChange={(date: Date | null) => date && setDateTo(date)}
                      unit={unitFilter}
                      onUnitChange={setUnitFilter}
                      showUnitFilter={false}
                      showStatusFilter={false}
                      className="rounded-unit"
                    />
                  </div>
                </div>
              }
            />

            <div className="rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] overflow-hidden shadow-unit-sm">
              <DataTable
                data={incomes}
                columns={columns}
                actions={actions}
                keyExtractor={(row) => row.id}
                loading={isLoading}
                searchPlaceholder=""
                filters={[]}
                emptyMessage="No se encontraron ingresos registrados para los criterios seleccionados."
              />
            </div>
          </div>
        )}

        {/* Income Detail Drawer */}
        <IncomeDetailDrawer
          income={selectedIncome}
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedIncome(null);
          }}
        />

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setIncomeToDelete(null);
          }}
          onConfirm={() => {
            if (incomeToDelete) {
              deleteMutation.mutate(incomeToDelete.id);
            }
          }}
          title="Eliminar Ingreso"
          message={`¿Estás seguro de que deseas eliminar este comprobante de ingreso por un monto de S/ ${Number(incomeToDelete?.total || incomeToDelete?.amount || 0).toFixed(2)}?`}
          confirmText="Eliminar Ingreso"
          type="danger"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </div>
  );
}