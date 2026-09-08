'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataTable, Button } from '@/components/ui';
import { TableToolbar } from '@/components/ui/TableToolbar';
import { TableBadge } from '@/components/ui/TableBadge';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { Activity, Package, TrendingDown, TrendingUp, ArrowDownRight, ArrowUpRight, Calendar, Search, Filter, X, ChevronDown, ChevronUp, AlertCircle, Home, Plus, FileText, FileSpreadsheet, BarChart3, Sparkles, Download } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useUnitStore } from '@/store/unitStore';
import { downloadExcelReport } from '@/lib/excelReport';
import { downloadPdfReport } from '@/lib/pdfReport';
import { useBusinessConfig } from '@/hooks/useBusinessConfig';

interface StockMovement {
  id: string;
  type: 'STOCK_ENTRY' | 'INTERNAL_USE' | 'SALE' | 'ADJUSTMENT';
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reason?: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
  };
  createdBy?: {
    id: string;
    name: string;
  };
}

export function StockMovementsPage(): JSX.Element {
  const [dateFrom, setDateFrom] = useState(() => startOfDay(subDays(new Date(), 7)));
  const [dateTo, setDateTo] = useState(() => endOfDay(new Date()));
  const [productId, setProductId] = useState('');
  const [search, setSearch] = useState('');
  const activeUnit = useUnitStore((s) => s.activeUnit);
  
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
  const [showFilters, setShowFilters] = useState(false);
  const [movementType, setMovementType] = useState('');
  
  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === 'ADMIN';
  const currentPage = 1;
  const pageSize = 20;
  const { data: businessConfig } = useBusinessConfig();

  // Función de exportación Excel
  const handleExportExcel = async () => {
    try {
      const exportParams = new URLSearchParams();
      if (dateFrom) exportParams.set('dateFrom', dateFrom.toISOString());
      if (dateTo) exportParams.set('dateTo', dateTo.toISOString());
      if (productId) exportParams.set('productId', productId);
      if (debouncedSearch) exportParams.set('search', debouncedSearch);
      if (movementType) exportParams.set('type', movementType);
      exportParams.set('exportLimit', '5000');

      const { data: rows } = await api.get(`/api/inventory/movements/export?${exportParams}`);
      if (!rows?.length) return;

      await downloadExcelReport(
        `movimientos-inventario-${new Date().toISOString().slice(0, 10)}.xlsx`,
        'Movimientos',
        ['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Stock Antes', 'Stock Después', 'Motivo', 'Usuario'],
        rows.map((movement: any) => [
          format(new Date(movement.createdAt), 'dd/MM/yyyy HH:mm'),
          movement.product?.name || '—',
          getMovementType(movement.type).label,
          movement.quantity,
          movement.stockBefore,
          movement.stockAfter,
          movement.reason || 'Sin motivo',
          movement.createdBy?.name || 'Sistema'
        ]),
        {
          reportTitle: 'KARDEX DE MOVIMIENTOS DE INVENTARIO',
          periodInfo: dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined,
          filterInfo: movementType ? `Tipo: ${movementType}` : undefined
        }
      );
    } catch (error) {
      // Error exporting Excel
    }
  };

  // Función de exportación PDF
  const handleExportPDF = async () => {
    try {
      const exportParams = new URLSearchParams();
      if (dateFrom) exportParams.set('dateFrom', dateFrom.toISOString());
      if (dateTo) exportParams.set('dateTo', dateTo.toISOString());
      if (productId) exportParams.set('productId', productId);
      if (debouncedSearch) exportParams.set('search', debouncedSearch);
      if (movementType) exportParams.set('type', movementType);
      exportParams.set('exportLimit', '5000');

      const { data: rows } = await api.get(`/api/inventory/movements/export?${exportParams}`);
      if (!rows?.length) return;

      await downloadPdfReport(
        `movimientos-inventario-${new Date().toISOString().slice(0, 10)}.pdf`,
        'KARDEX DE MOVIMIENTOS DE INVENTARIO',
        dateFrom && dateTo ? `Período: ${format(dateFrom, 'dd/MM/yyyy')} al ${format(dateTo, 'dd/MM/yyyy')}` : 'Movimientos Generales',
        ['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Stock Antes', 'Stock Después', 'Motivo', 'Usuario'],
        rows.map((movement: any) => [
          format(new Date(movement.createdAt), 'dd/MM/yyyy HH:mm'),
          movement.product?.name || '—',
          getMovementType(movement.type).label,
          movement.quantity,
          movement.stockBefore,
          movement.stockAfter,
          movement.reason || 'Sin motivo',
          movement.createdBy?.name || 'Sistema'
        ]),
        {
          businessName: businessConfig?.businessName,
          businessAddress: businessConfig?.businessAddress,
          businessPhone: businessConfig?.businessPhone,
          periodInfo: dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined,
          filterInfo: movementType ? `Tipo: ${movementType}` : undefined
        }
      );
    } catch (error) {
      // Error exporting PDF
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['stock-movements', dateFrom, dateTo, productId, currentPage, debouncedSearch, activeUnit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom.toISOString());
      if (dateTo) params.set('dateTo', dateTo.toISOString());
      if (productId) params.set('productId', productId);
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (activeUnit) params.set('unit', activeUnit);
      params.set('page', String(currentPage));
      params.set('limit', String(pageSize));
      
      const { data } = await api.get(`/api/inventory/movements?${params}`);
      return data;
    },
  });

  const movements = data?.data || [];
  const pagination = data?.pagination || { page: 1, total: 0, totalPages: 0 };

  // Get products for filter
  const { data: products } = useQuery({
    queryKey: ['inventory-products-for-filter'],
    queryFn: async () => {
      const { data } = await api.get('/api/inventory/products?limit=1000');
      return data.data || [];
    },
  });

  const getMovementType = (type: string) => {
    switch (type) {
      case 'STOCK_ENTRY': return { label: 'Entrada', type: 'status-active' as const, icon: ArrowDownRight };
      case 'INTERNAL_USE': return { label: 'Uso Interno', type: 'status-pending' as const, icon: Home };
      case 'SALE': return { label: 'Venta', type: 'action-login' as const, icon: TrendingUp };
      case 'ADJUSTMENT': return { label: 'Ajuste', type: 'status-default' as const, icon: Activity };
      default: return { label: type, type: 'status-default' as const, icon: Activity };
    }
  };

  const columns: any[] = [
    {
      key: 'createdAt',
      header: 'Fecha',
      sortable: true,
      render: (row: StockMovement) => (
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800">
            {format(new Date(row.createdAt), 'dd/MM/yyyy')}
          </span>
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-[var(--unit-text)]">
            {format(new Date(row.createdAt), 'HH:mm')}
          </span>
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Producto',
      sortable: true,
      render: (row: StockMovement) => (
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
            {row.product.name}
          </span>
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-[var(--unit-text)] font-mono">
            ID: {row.product.id.slice(-8)}
          </span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      sortable: true,
      render: (row: StockMovement) => {
        const typeInfo = getMovementType(row.type);
        const Icon = typeInfo.icon;
        return (
          <TableBadge type={typeInfo.type}>
            <Icon className="h-3 w-3 mr-1" />
            {typeInfo.label}
          </TableBadge>
        );
      },
    },
    {
      key: 'quantity',
      header: 'Cantidad',
      sortable: true,
      render: (row: StockMovement) => (
        <TableBadge 
          type={row.quantity > 0 ? 'status-active' : 'status-inactive'}
        >
          {row.quantity > 0 ? <ArrowDownRight className="h-3 w-3 mr-1" /> : <ArrowUpRight className="h-3 w-3 mr-1" />}
          {row.quantity > 0 ? '+' : ''}{row.quantity}
        </TableBadge>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      sortable: false,
      render: (row: StockMovement) => (
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-mono text-[var(--unit-text-muted)]">
            Antes: {row.stockBefore}
          </span>
          <span className="text-[11px] font-mono font-bold text-[var(--unit-text)]">
            Después: {row.stockAfter}
          </span>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Motivo',
      sortable: false,
      render: (row: StockMovement) => (
        <span className="text-xs text-[var(--unit-text)] truncate max-w-[150px] block" title={row.reason}>
          {row.reason || 'Sin motivo'}
        </span>
      ),
    },
    {
      key: 'createdBy',
      header: 'Usuario',
      sortable: true,
      render: (row: StockMovement) => (
        <TableBadge type="status-default">
          {row.createdBy?.name || 'Sistema'}
        </TableBadge>
      ),
    },
  ];

  const metrics = useMemo(() => {
    const total = pagination.total || movements.length;
    const entries = movements.filter((m: any) => m.type === 'STOCK_ENTRY').length;
    const internalUse = movements.filter((m: any) => m.type === 'INTERNAL_USE').length;
    const salesAdjustments = movements.filter((m: any) => m.type === 'SALE' || m.type === 'ADJUSTMENT').length;
    return { total, entries, internalUse, salesAdjustments };
  }, [movements, pagination]);

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--unit-surface)] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-[var(--unit-text)] font-medium">Error al cargar movimientos</p>
          <p className="text-[var(--unit-text-muted)] text-sm mt-2">
            Por favor intenta recargar la página
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--unit-surface)]">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Top Header & Fast Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--unit-border)]/40 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-unit bg-[var(--unit-accent)] text-white shadow-unit-sm shrink-0">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--unit-accent)]/10 text-[var(--unit-accent)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--unit-accent)] animate-pulse" />
                  Kardex de Inventario • {activeUnit === 'BARBERIA' ? 'Barbería' : activeUnit === 'SPA' ? 'SPA' : 'General'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--unit-text)]">
                Movimientos de Inventario
              </h1>
              <p className="text-xs sm:text-sm font-medium text-[var(--unit-text-muted)] mt-0.5">
                Auditoría de entradas, salidas por uso interno, ventas y ajustes de stock
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-center mt-2 md:mt-0">
            {canEdit && (
              <>
                <Link
                  href="/inventory/use"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold transition-all shadow-unit-sm"
                >
                  <Home className="h-4 w-4" />
                  Registrar Uso Interno
                </Link>
                <Link
                  href="/inventory/entry"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/90 text-white text-sm font-bold transition-all shadow-unit-sm"
                >
                  <ArrowDownRight className="h-4 w-4" />
                  Entrada de Stock
                </Link>
                <Link
                  href="/inventory/products"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-[var(--unit-border)]/60 text-sm font-bold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-all shadow-sm"
                >
                  <Package className="h-4 w-4 text-[var(--unit-accent)]" />
                  <span className="hidden sm:inline">Productos</span>
                </Link>
                <div className="h-8 w-px bg-[var(--unit-border)]/40 mx-1"></div>
                <button
                  onClick={handleExportExcel}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-[var(--unit-border)]/60 text-sm font-bold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-all shadow-sm text-emerald-600"
                  title="Exportar a Excel"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                </button>
                <button
                  onClick={handleExportPDF}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-[var(--unit-border)]/60 text-sm font-bold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-all shadow-sm text-rose-600"
                  title="Exportar a PDF"
                >
                  <FileText className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Ergonomic Micro Status Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3">
            <div className="h-9 w-9 rounded-unit bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Total Movimientos</p>
              <p className="text-lg font-bold text-[var(--unit-text)]">{metrics.total}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3">
            <div className="h-9 w-9 rounded-unit bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <ArrowDownRight className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Entradas Stock</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{metrics.entries}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3">
            <div className="h-9 w-9 rounded-unit bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Home className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Uso Interno</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{metrics.internalUse}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3">
            <div className="h-9 w-9 rounded-unit bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Ventas / Ajustes</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{metrics.salesAdjustments}</p>
            </div>
          </div>
        </div>

        {/* Enhanced Movements Filters */}
        <div className="space-y-4 animate-in fade-in duration-200 mb-8">
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar producto o motivo..."
            chips={[
              { id: '', label: 'Todos' },
              { id: 'STOCK_ENTRY', label: 'Entrada' },
              { id: 'INTERNAL_USE', label: 'Uso Interno' },
              { id: 'SALE', label: 'Venta' },
              { id: 'ADJUSTMENT', label: 'Ajuste' },
            ]}
            activeChip={movementType}
            onChipChange={(id) => setMovementType(id as string)}
            showAdvancedFiltersButton={true}
            isAdvancedOpen={showFilters}
            onToggleAdvanced={() => setShowFilters(!showFilters)}
            activeFiltersCount={(productId ? 1 : 0) + (dateFrom ? 1 : 0)}
            onResetFilters={() => {
              setProductId('');
              setMovementType('');
              setDateFrom(startOfDay(subDays(new Date(), 7)));
              setDateTo(endOfDay(new Date()));
            }}
            advancedFiltersContent={
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Product Filter */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[var(--unit-text-muted)] uppercase">Producto</label>
                    <select
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      className="w-full px-3 py-2 rounded-unit border border-[var(--unit-border)]/60 bg-[var(--unit-surface)] text-xs text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/40"
                    >
                      <option value="">Todos los productos</option>
                      {products?.map((product: any) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
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
                    showUnitFilter={false}
                    showStatusFilter={false}
                    className="rounded-unit"
                  />
                </div>
              </div>
            }
          />
        </div>

        {/* Movements Table */}
        <div className="rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)]/40 backdrop-blur-md p-6">
          {/* Table Header */}
          <div className="flex items-center justify-between border-b border-[var(--unit-border)]/30 pb-3 mb-4">
            <div className="flex items-center gap-2 text-[var(--unit-accent)]">
              <Activity className="h-4 w-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--unit-text)]">Historial de Movimientos</h3>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--unit-accent)]/10 text-[var(--unit-accent)]">
              {movements.length} movimientos
            </span>
          </div>

          {/* Table */}
          <DataTable
            data={movements}
            columns={columns}
            loading={isLoading}
            keyExtractor={(row: any) => row.id}
          />
        </div>
      </div>
    </div>
  );
}
