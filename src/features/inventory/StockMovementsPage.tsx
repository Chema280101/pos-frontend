'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataTable } from '@/components/ui/DataTable';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { Activity, Package, TrendingDown, TrendingUp, ArrowDownRight, ArrowUpRight, Calendar, Search, Filter, X, ChevronDown, ChevronUp, AlertCircle, Home, Plus, FileText, BarChart3, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

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
  const [showFilters, setShowFilters] = useState(true);
  const [movementType, setMovementType] = useState('');
  
  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === 'ADMIN';
  const currentPage = 1;
  const pageSize = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ['stock-movements', dateFrom, dateTo, productId, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom.toISOString());
      if (dateTo) params.set('dateTo', dateTo.toISOString());
      if (productId) params.set('productId', productId);
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
      case 'STOCK_ENTRY': return { label: 'Entrada', color: 'text-green-600 bg-green-100', icon: ArrowDownRight };
      case 'INTERNAL_USE': return { label: 'Uso Interno', color: 'text-orange-600 bg-orange-100', icon: Home };
      case 'SALE': return { label: 'Venta', color: 'text-blue-600 bg-blue-100', icon: TrendingUp };
      case 'ADJUSTMENT': return { label: 'Ajuste', color: 'text-purple-600 bg-purple-100', icon: Activity };
      default: return { label: type, color: 'text-gray-600 bg-gray-100', icon: Activity };
    }
  };

  const columns: any[] = [
    {
      key: 'createdAt',
      header: 'Fecha',
      sortable: true,
      render: (row: StockMovement) => (
        <div>
          <div className="font-medium text-gray-900">
            {new Date(row.createdAt).toLocaleDateString('es-PE')}
          </div>
          <div className="text-sm text-gray-500">
            {new Date(row.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Producto',
      sortable: true,
      render: (row: StockMovement) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-gray-400" />
          <div>
            <div className="font-medium text-gray-900">{row.product.name}</div>
            <div className="text-sm text-gray-500">ID: {row.product.id.slice(-8)}</div>
          </div>
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
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', typeInfo.color)}>
            <Icon className="h-3 w-3" />
            {typeInfo.label}
          </span>
        );
      },
    },
    {
      key: 'quantity',
      header: 'Cantidad',
      sortable: true,
      render: (row: StockMovement) => (
        <div className="flex items-center gap-2">
          {row.quantity > 0 ? (
            <ArrowDownRight className="h-4 w-4 text-green-600" />
          ) : (
            <ArrowUpRight className="h-4 w-4 text-red-600" />
          )}
          <span className={cn('font-medium', row.quantity > 0 ? 'text-green-600' : 'text-red-600')}>
            {row.quantity > 0 ? '+' : ''}{row.quantity}
          </span>
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      sortable: false,
      render: (row: StockMovement) => (
        <div className="text-sm">
          <div className="text-gray-500">Antes: {row.stockBefore}</div>
          <div className="font-medium text-gray-900">Después: {row.stockAfter}</div>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Motivo',
      sortable: false,
      render: (row: StockMovement) => (
        <div className="text-sm text-gray-900">
          {row.reason || '-'}
        </div>
      ),
    },
    {
      key: 'createdBy',
      header: 'Usuario',
      sortable: true,
      render: (row: StockMovement) => (
        <div className="text-sm text-gray-900">
          {row.createdBy?.name || 'Sistema'}
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--unit-surface)] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-[var(--unit-text)] font-medium">Error al cargar movimientos</p>
          <p className="text-[var(--unit-text-muted)] text-sm mt-2">
            {error instanceof Error ? error.message : 'Error desconocido'}
          </p>
        </div>
      </div>
    );
  }

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
                Sistema de Movimientos
              </span>
            </div>
            <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">Movimientos de Inventario</h1>
            <p className="text-[var(--unit-text-muted)]">
              Historial completo de movimientos y consumo de productos
            </p>
          </div>

          {/* Enhanced Action Buttons - Exacto estilo InventoryPage */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {canEdit && (
              <>
                <Link href="/inventory/movements/internal-use" className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold shadow-lg border-2 border-orange-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
                  <Home className="h-5 w-5" />
                  Registrar Uso Interno
                </Link>
                <Link href="/inventory/entry" className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg border-2 border-emerald-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
                  <ArrowDownRight className="h-5 w-5" />
                  Entrada de Stock
                </Link>
                <Link href="/inventory" className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white font-bold shadow-lg border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
                  <Package className="h-5 w-5" />
                  Inventario
                </Link>
                <button className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-lg border-2 border-blue-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
                  <FileText className="h-5 w-5" />
                  Exportar
                </button>
              </>
            )}
          </div>
        </div>

        {/* Enhanced Movements Filters - Exacto estilo InventoryPage */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6 mb-8">
          {/* Filter Header */}
          <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Filtros de Movimientos</h3>
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
                {/* Product Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Producto</label>
                  <select
                    value={productId}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                    onChange={(e) => setProductId(e.target.value)}
                  >
                    <option value="">Todos los productos</option>
                    {products?.map((product: any) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Movement Type Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Tipo de Movimiento</label>
                  <select
                    value={movementType}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                    onChange={(e) => setMovementType(e.target.value)}
                  >
                    <option value="">Todos los tipos</option>
                    <option value="STOCK_ENTRY">Entrada de Stock</option>
                    <option value="INTERNAL_USE">Uso Interno</option>
                    <option value="SALE">Venta</option>
                    <option value="ADJUSTMENT">Ajuste</option>
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
                      placeholder="Buscar producto o motivo..."
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

              {/* Enhanced Active Filters Summary */}
              {(productId || movementType || search) && (
                <div className="rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Filtros activos:</span>
                      <div className="flex flex-wrap gap-2">
                        {productId && products && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700 border border-sky-200">
                            Producto: {products.find((p: any) => p.id === productId)?.name}
                          </span>
                        )}
                        {movementType && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--unit-accent)]/20 px-3 py-1 text-xs font-medium text-[var(--unit-accent)] border border-[var(--unit-accent)]/30">
                            Tipo: {movementType === 'STOCK_ENTRY' ? 'Entrada' : 
                                   movementType === 'INTERNAL_USE' ? 'Uso Interno' : 
                                   movementType === 'SALE' ? 'Venta' : 
                                   movementType === 'ADJUSTMENT' ? 'Ajuste' : movementType}
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
                        setProductId('');
                        setMovementType('');
                        setSearch('');
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

        {/* Movements Table - Exacto estilo InventoryPage */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6">
          {/* Table Header */}
          <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Historial de Movimientos</h3>
                  <p className="text-sm text-[var(--unit-text-muted)]">Todos los movimientos de inventario</p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-[var(--unit-accent)]/20 px-3 py-1.5 text-sm font-bold text-[var(--unit-accent)] border border-[var(--unit-accent)]/30 shadow-sm">
                {movements.length} movimientos
              </span>
            </div>
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
