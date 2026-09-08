'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  TrendingDown, 
  TrendingUp,
  Filter, 
  Search, 
  DollarSign, 
  Calendar, 
  RefreshCw, 
  Plus, 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  Trash2, 
  Edit, 
  Receipt, 
  Clock, 
  Building2,
  Lock,
  Tag,
  AlertCircle,
  Vault,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { api } from '@/lib/api';
import { downloadExcelReport } from '@/lib/excelReport';
import { downloadPdfReport } from '@/lib/pdfReport';
import { useAuthStore } from '@/store/authStore';
import { useUnitStore } from '@/store/unitStore';
import { DataTable } from '@/components/ui/DataTable';
import { TableToolbar } from '@/components/ui/TableToolbar';
import { TableBadge } from '@/components/ui/TableBadge';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ExpenseDetailDrawer, type ExpenseRecord } from './ExpenseDetailDrawer';
import { ExpensesMetrics } from './ExpensesMetrics';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

export function ExpensesPage(): JSX.Element {
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
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Sync unitFilter with activeUnit
  useEffect(() => {
    if (activeUnit) {
      setUnitFilter(activeUnit);
    }
  }, [activeUnit]);

  // Drawer and Dialog state
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseRecord | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Expenses Query
  const { 
    data: expensesData, 
    isLoading, 
    isFetching, 
    refetch 
  } = useQuery({
    queryKey: ['expenses', unitFilter, dateFrom, dateTo, categoryFilter, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (unitFilter) params.set('unitFilter', unitFilter);
      if (dateFrom) params.set('dateFrom', dateFrom.toISOString());
      if (dateTo) params.set('dateTo', dateTo.toISOString());
      if (categoryFilter) params.set('category', categoryFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);

      const { data } = await api.get(`/api/expenses?${params}`);
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const expenses: ExpenseRecord[] = Array.isArray(expensesData?.data)
    ? expensesData.data
    : Array.isArray(expensesData?.expenses)
    ? expensesData.expenses
    : Array.isArray(expensesData)
    ? expensesData
    : [];

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/api/expenses/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-open'] });
      success('Egreso eliminado exitosamente');
      setShowDeleteDialog(false);
      setExpenseToDelete(null);
    },
    onError: (err: any) => {
      toastError(err?.response?.data?.error || 'Error al eliminar el gasto');
    },
  });

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalCount = expenses.length;
    const totalAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const avgAmount = totalCount > 0 ? (totalAmount / totalCount).toFixed(2) : '0.00';

    return {
      totalCount,
      totalAmount: totalAmount.toFixed(2),
      avgAmount,
    };
  }, [expenses]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Columns definition
  const columns = [
    {
      key: 'reason',
      header: 'Concepto / Motivo',
      render: (row: ExpenseRecord) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-unit bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <TrendingDown className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-[var(--unit-text)] text-sm">{row.reason}</span>
            <p className="text-[11px] text-[var(--unit-text-muted)] flex items-center gap-1">
              Registrado por: <span className="font-semibold text-[var(--unit-text)]">{row.createdBy?.name || 'Sistema'}</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Categoría',
      render: (row: ExpenseRecord) => (
        <TableBadge type="status-default">
          {row.category || 'General'}
        </TableBadge>
      ),
    },
    {
      key: 'unit',
      header: 'Unidad',
      render: (row: ExpenseRecord) => {
        const unit = row.cashRegister?.unit || activeUnit;
        return (
          <TableBadge type={unit === 'BARBERIA' ? 'unit-barberia' : 'unit-spa'}>
            {unit === 'BARBERIA' ? 'Barbería' : 'SPA'}
          </TableBadge>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Fecha / Hora',
      render: (row: ExpenseRecord) => (
        <span className="text-xs font-mono text-[var(--unit-text)] flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-[var(--unit-accent)]" />
          {row.createdAt ? format(new Date(row.createdAt), 'dd/MM/yyyy HH:mm', { locale: es }) : 'N/A'}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Monto (S/)',
      render: (row: ExpenseRecord) => (
        <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
          - S/ {Number(row.amount || 0).toFixed(2)}
        </span>
      ),
    },
  ];

  // Actions
  const actions = [
    {
      label: 'Ver Comprobante',
      variant: 'view' as const,
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: ExpenseRecord) => {
        setSelectedExpense(row);
        setDrawerOpen(true);
      },
    },
    {
      label: 'Eliminar',
      variant: 'delete' as const,
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: ExpenseRecord) => {
        setExpenseToDelete(row);
        setShowDeleteDialog(true);
      },
      disabled: () => !canEdit,
    },
  ];

  const handleExportExcel = () => {
    try {
      const headers = ['Concepto / Motivo', 'Categoría', 'Unidad', 'Fecha / Hora', 'Registrado Por', 'Monto (S/)'];
      const rows = (expenses || []).map((exp: ExpenseRecord) => [
        exp.reason || '—',
        exp.category || 'General',
        (exp.cashRegister?.unit || activeUnit || 'General') === 'BARBERIA' ? 'Barbería' : 'SPA',
        exp.createdAt ? format(new Date(exp.createdAt), 'dd/MM/yyyy HH:mm', { locale: es }) : '—',
        exp.createdBy?.name || 'Sistema',
        Number(exp.amount || 0).toFixed(2),
      ]);

      const totalVal = (expenses || []).reduce((acc: number, curr: ExpenseRecord) => acc + Number(curr.amount || 0), 0);

      downloadExcelReport(
        `gastos-${activeUnit || 'general'}-${new Date().toISOString().slice(0, 10)}.xlsx`,
        'Gastos',
        headers,
        rows,
        {
          unit: activeUnit || 'General',
          reportTitle: `CONTROL DE GASTOS Y DESEMBOLSOS - ${(activeUnit || 'GENERAL').toUpperCase()}`,
          periodInfo: dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined,
          totalAmount: totalVal,
          filterInfo: activeUnit ? `Unidad: ${activeUnit}` : undefined
        }
      );
      success('Reporte Excel descargado');
    } catch {
      toastError('Error al exportar gastos a Excel');
    }
  };

  const handleExportPdf = () => {
    try {
      const headers = ['Concepto / Motivo', 'Categoría', 'Unidad', 'Fecha / Hora', 'Registrado Por', 'Monto (S/)'];
      const rows = (expenses || []).map((exp: ExpenseRecord) => [
        exp.reason || '—',
        exp.category || 'General',
        (exp.cashRegister?.unit || activeUnit || 'General') === 'BARBERIA' ? 'Barbería' : 'SPA',
        exp.createdAt ? format(new Date(exp.createdAt), 'dd/MM/yyyy HH:mm', { locale: es }) : '—',
        exp.createdBy?.name || 'Sistema',
        Number(exp.amount || 0).toFixed(2),
      ]);

      const totalVal = (expenses || []).reduce((acc: number, curr: ExpenseRecord) => acc + Number(curr.amount || 0), 0);

      downloadPdfReport(
        `gastos-${activeUnit || 'general'}-${new Date().toISOString().slice(0, 10)}.pdf`,
        'CONTROL DE GASTOS Y DESEMBOLSOS',
        activeUnit || 'General',
        headers,
        rows,
        {
          unit: activeUnit || 'General',
          periodInfo: dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined,
          totals: {
            label: 'TOTAL EGRESOS:',
            amount: totalVal,
            currency: 'S/'
          },
          filterInfo: activeUnit ? `Unidad: ${activeUnit}` : undefined
        }
      );
      success('Reporte PDF descargado');
    } catch {
      toastError('Error al exportar gastos a PDF');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--unit-surface)]">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Top Header & Fast Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--unit-border)]/40 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] text-xs font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--unit-accent)] animate-pulse" />
                Control de Egresos • {activeUnit === 'BARBERIA' ? 'Barbería' : 'SPA'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--unit-text)] tracking-tight">
              Gastos & Desembolsos
            </h1>
            <p className="text-xs sm:text-sm text-[var(--unit-text-muted)]">
              Auditoría y control de egresos de caja chica, insumos y compras operativas
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportExcel}
              disabled={!expenses || expenses.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-xs font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-all shadow-unit-sm disabled:opacity-50"
              title="Descargar reporte Excel"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={!expenses || expenses.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-xs font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-all shadow-unit-sm disabled:opacity-50"
              title="Descargar reporte PDF"
            >
              <FileText className="h-4 w-4 text-rose-600" />
              <span className="hidden sm:inline">PDF</span>
            </button>

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
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Total Comprobantes</p>
              <p className="text-lg font-bold text-[var(--unit-text)]">{metrics.totalCount}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3">
            <div className="h-9 w-9 rounded-unit bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
              <TrendingDown className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Total Desembolsado</p>
              <p className="text-lg font-bold text-rose-600 dark:text-rose-400 font-mono">S/ {metrics.totalAmount}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="h-9 w-9 rounded-unit bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Promedio por Gasto</p>
              <p className="text-lg font-bold text-amber-600 font-mono">S/ {metrics.avgAmount}</p>
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
              <TrendingDown className="h-3.5 w-3.5" />
              Listado de Gastos ({metrics.totalCount})
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

        {activeTab === 'metrics' ? (
          <div className="pt-2">
            <ExpensesMetrics expenses={expenses as any} />
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-200">
            <TableToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por concepto o motivo de gasto..."
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
              activeFiltersCount={(categoryFilter ? 1 : 0) + (dateFrom ? 1 : 0)}
              onResetFilters={() => {
                setCategoryFilter('');
                setUnitFilter('');
              }}
              advancedFiltersContent={
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Category Filter */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[var(--unit-text-muted)] uppercase">Categoría</label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-unit border border-[var(--unit-border)]/60 bg-[var(--unit-surface)] text-xs text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/40"
                      >
                        <option value="">Todas las categorías</option>
                        <option value="Insumos">Insumos</option>
                        <option value="Servicios">Servicios</option>
                        <option value="Mantenimiento">Mantenimiento</option>
                        <option value="Alquiler">Alquiler</option>
                        <option value="Servicios básicos">Servicios básicos</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Oficina">Oficina</option>
                        <option value="Otros">Otros</option>
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
                data={expenses}
                columns={columns}
                actions={actions}
                keyExtractor={(row) => row.id}
                loading={isLoading}
                searchPlaceholder=""
                filters={[]}
                emptyMessage="No se encontraron gastos registrados para los criterios seleccionados."
              />
            </div>
          </div>
        )}

        {/* Expense Detail Drawer */}
        <ExpenseDetailDrawer
          expense={selectedExpense}
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedExpense(null);
          }}
        />

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setExpenseToDelete(null);
          }}
          onConfirm={() => {
            if (expenseToDelete) {
              deleteMutation.mutate(expenseToDelete.id);
            }
          }}
          title="Eliminar Gasto"
          message={`¿Estás seguro de que deseas eliminar el registro de gasto "${expenseToDelete?.reason}" por un monto de S/ ${Number(expenseToDelete?.amount || 0).toFixed(2)}?`}
          confirmText="Eliminar Gasto"
          type="danger"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </div>
  );
}
