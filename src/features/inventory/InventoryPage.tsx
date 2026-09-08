'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  ArrowUpRight, 
  Eye, 
  Edit, 
  Trash2, 
  Filter, 
  Search, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  DollarSign, 
  Building2, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Barcode, 
  Layers, 
  Tag, 
  Check, 
  SlidersHorizontal,
  Home
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useUnitStore } from '@/store/unitStore';
import { DataTable } from '@/components/ui/DataTable';
import { TableToolbar, type QuickChip } from '@/components/ui/TableToolbar';
import { TableBadge } from '@/components/ui/TableBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ProductDetailDrawer } from './ProductDetailDrawer';
import { InventoryMetrics } from './InventoryMetrics';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import type { Product } from '@/types/product';

export function InventoryPage(): JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const activeUnit = useUnitStore((s) => s.activeUnit);
  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === 'ADMIN';
  const { success, error: toastError } = useToast();

  // Navigation tab: 'list' | 'low_stock' | 'metrics'
  const [activeTab, setActiveTab] = useState<'list' | 'low_stock' | 'metrics'>('list');

  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState<string>(activeUnit || '');

  // Keep unitFilter synced when activeUnit changes
  useEffect(() => {
    if (activeUnit) {
      setUnitFilter(activeUnit);
    }
  }, [activeUnit]);

  // Drawer & Dialog states
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Main Products Query
  const { 
    data: productsData, 
    isLoading, 
    isFetching, 
    refetch 
  } = useQuery({
    queryKey: ['inventory-products', unitFilter, currentPage, pageSize, categoryId, typeFilter, debouncedSearch, activeTab],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (unitFilter) params.set('unit', unitFilter);
      params.set('page', String(currentPage));
      params.set('limit', String(pageSize));
      if (categoryId) params.set('categoryId', categoryId);
      if (typeFilter) params.set('type', typeFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (activeTab === 'low_stock') params.set('lowStock', 'true');

      const { data } = await api.get(`/api/inventory/products?${params}`);
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });

  // Product categories query
  const { data: categories = [] } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const { data } = await api.get('/api/inventory/products/categories');
      return data || [];
    },
  });

  // Delete / Toggle Active Mutation
  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await api.delete(`/api/inventory/products/${productId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      success('Estado del producto actualizado');
      setShowDeleteDialog(false);
      setProductToDelete(null);
    },
    onError: (err: any) => {
      toastError(err?.response?.data?.error || err?.message || 'Error al modificar el producto');
    },
  });

  const products: Product[] = Array.isArray(productsData?.data) 
    ? productsData.data 
    : Array.isArray(productsData?.products)
    ? productsData.products
    : Array.isArray(productsData) 
    ? productsData 
    : [];

  const pagination = productsData?.pagination || {
    page: 1,
    limit: pageSize,
    total: products.length,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  };

  // Summary Metrics calculations
  const metrics = useMemo(() => {
    const total = pagination.total || products.length;
    const lowStock = products.filter((p) => (p.stock ?? 0) < (p.minStock ?? 0)).length;
    const totalCostValue = products.reduce((sum, p) => sum + (Number(p.costPrice) || 0) * (Number(p.stock) || 0), 0);
    const totalSaleValue = products.reduce((sum, p) => sum + (Number(p.salePrice) || 0) * (Number(p.stock) || 0), 0);

    return {
      total,
      lowStock,
      totalCostValue,
      totalSaleValue,
    };
  }, [products, pagination.total]);

  // Force refresh handler
  const handleRefresh = useCallback(() => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['product-categories'] });
  }, [refetch, queryClient]);

  // Quick Chips for Product Type
  const typeChips: QuickChip[] = [
    { id: '', label: 'Todos' },
    { id: 'FOR_SALE', label: 'Venta' },
    { id: 'INTERNAL_USE', label: 'Uso Interno' },
    { id: 'BOTH', label: 'Venta & Uso' },
  ];

  // Table columns definition
  const columns = [
    {
      key: 'name',
      header: 'Producto / SKU',
      render: (row: Product) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-unit bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] flex items-center justify-center shrink-0">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[var(--unit-text)] text-sm">{row.name}</span>
              {row.stock < row.minStock && (
                <span title="Stock bajo el mínimo">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                </span>
              )}
            </div>
            {row.barcode ? (
              <span className="text-[11px] font-mono text-[var(--unit-text-muted)] flex items-center gap-1">
                <Barcode className="h-3 w-3" />
                {row.barcode}
              </span>
            ) : (
              <span className="text-[11px] text-[var(--unit-text-muted)]">Sin código</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Categoría',
      render: (row: Product) => (
        <TableBadge type="status-default">
          {row.category?.name || 'Sin categoría'}
        </TableBadge>
      ),
    },
    {
      key: 'unit',
      header: 'Unidad',
      render: (row: Product) => (
        <TableBadge type={row.unit === 'BARBERIA' ? 'unit-barberia' : 'unit-spa'}>
          {row.unit === 'BARBERIA' ? 'Barbería' : 'SPA'}
        </TableBadge>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (row: Product) => (
        <TableBadge type={row.type === 'FOR_SALE' ? 'action-login' : row.type === 'INTERNAL_USE' ? 'status-pending' : 'status-active'}>
          {row.type === 'FOR_SALE' ? 'Venta' : row.type === 'INTERNAL_USE' ? 'Uso Interno' : 'Venta & Uso'}
        </TableBadge>
      ),
    },
    {
      key: 'stock',
      header: 'Stock Actual',
      render: (row: Product) => {
        const isLow = row.stock < row.minStock && row.stock > 0;
        const isZero = row.stock === 0;

        return (
          <div className="flex flex-col">
            <TableBadge type={isZero ? 'status-inactive' : isLow ? 'status-pending' : 'status-active'} className="font-mono w-fit">
              {row.stock} {row.measureUnit}
            </TableBadge>
            <span className="text-[10px] text-[var(--unit-text-muted)] font-mono pl-1">
              Mín: {row.minStock} {row.measureUnit}
            </span>
          </div>
        );
      },
    },
    {
      key: 'prices',
      header: 'Precios (S/)',
      render: (row: Product) => (
        <div className="flex flex-col text-xs font-mono">
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {row.salePrice != null ? `Venta: S/ ${Number(row.salePrice).toFixed(2)}` : 'Venta: —'}
          </span>
          <span className="text-[11px] text-[var(--unit-text-muted)]">
            {row.costPrice != null ? `Costo: S/ ${Number(row.costPrice).toFixed(2)}` : 'Costo: —'}
          </span>
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Estado',
      render: (row: Product) => (
        <TableBadge type={row.isActive ? 'status-active' : 'status-inactive'}>
          {row.isActive ? 'Activo' : 'Inactivo'}
        </TableBadge>
      ),
    },
  ];

  // Table row actions
  const actions = [
    {
      label: 'Ver Ficha',
      variant: 'view' as const,
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: Product) => {
        setSelectedProductId(row.id);
        setDrawerOpen(true);
      },
    },
    {
      label: 'Editar',
      variant: 'edit' as const,
      icon: <Edit className="h-4 w-4" />,
      onClick: (row: Product) => {
        router.push(`/inventory/products/${row.id}/edit`);
      },
      disabled: () => !canEdit,
    },
    {
      label: 'Eliminar / Desactivar',
      variant: 'delete' as const,
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: Product) => {
        setProductToDelete(row);
        setShowDeleteDialog(true);
      },
      disabled: () => !canEdit,
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
                Gestión de Stock • {activeUnit === 'BARBERIA' ? 'Barbería' : 'SPA'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--unit-text)] tracking-tight">
              Inventario & Productos
            </h1>
            <p className="text-xs sm:text-sm text-[var(--unit-text-muted)]">
              Control de existencias, insumos profesionales y catálogo retail en tiempo real
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
              href="/inventory/entry"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-xs font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-all shadow-unit-sm"
            >
              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
              <span className="hidden sm:inline">Entrada Stock</span>
            </Link>

            <Link
              href="/inventory/movements"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-xs font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-all shadow-unit-sm"
            >
              <Activity className="h-4 w-4 text-purple-600" />
              <span className="hidden sm:inline">Movimientos</span>
            </Link>

            <Link
              href="/inventory/suppliers"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-xs font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-all shadow-unit-sm"
            >
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="hidden sm:inline">Proveedores</span>
            </Link>

            {canEdit && (
              <Link
                href="/inventory/products/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-unit bg-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/90 text-white text-xs font-bold transition-all shadow-unit active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                Nuevo Producto
              </Link>
            )}
          </div>
        </div>

        {/* Ergonomic Micro Status Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3">
            <div className="h-9 w-9 rounded-unit bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Total Productos</p>
              <p className="text-lg font-bold text-[var(--unit-text)]">{metrics.total}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3">
            <div className="h-9 w-9 rounded-unit bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Stock Bajo</p>
              <p className={cn("text-lg font-bold", metrics.lowStock > 0 ? "text-amber-600" : "text-[var(--unit-text)]")}>
                {metrics.lowStock}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3">
            <div className="h-9 w-9 rounded-unit bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Valor Costo</p>
              <p className="text-lg font-bold text-[var(--unit-text)] font-mono">
                S/ {metrics.totalCostValue.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3">
            <div className="h-9 w-9 rounded-unit bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Valor Venta</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                S/ {metrics.totalSaleValue.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher & Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Tab navigation pills */}
          <div className="flex items-center gap-1.5 p-1 bg-[var(--unit-surface-elevated)] rounded-unit-lg border border-[var(--unit-border)]/40 w-fit">
            <button
              onClick={() => setActiveTab('list')}
              className={cn(
                'px-4 py-2 rounded-unit text-xs font-bold transition-all flex items-center gap-2',
                activeTab === 'list'
                  ? 'bg-[var(--unit-accent)] text-white shadow-unit-sm'
                  : 'text-[var(--unit-text-muted)] hover:text-[var(--unit-text)]'
              )}
            >
              <Package className="h-3.5 w-3.5" />
              Catálogo / Lista
            </button>

            <button
              onClick={() => setActiveTab('low_stock')}
              className={cn(
                'px-4 py-2 rounded-unit text-xs font-bold transition-all flex items-center gap-2',
                activeTab === 'low_stock'
                  ? 'bg-[var(--unit-accent)] text-white shadow-unit-sm'
                  : 'text-[var(--unit-text-muted)] hover:text-[var(--unit-text)]'
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Stock Crítico ({metrics.lowStock})
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
              <Activity className="h-3.5 w-3.5" />
              Métricas Completas
            </button>
          </div>
        </div>

        {/* Content Section */}
        {activeTab === 'metrics' ? (
          <div className="pt-2">
            <InventoryMetrics products={products} />
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-200">
            <TableToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar producto o código..."
              chips={typeChips}
              activeChip={typeFilter}
              onChipChange={(id) => setTypeFilter(id as string)}
              showAdvancedFiltersButton={true}
              isAdvancedOpen={showFilters}
              onToggleAdvanced={() => setShowFilters(!showFilters)}
              activeFiltersCount={(categoryId ? 1 : 0) + (unitFilter ? 1 : 0)}
              onResetFilters={() => {
                setCategoryId('');
                setUnitFilter(activeUnit || '');
              }}
              advancedFiltersContent={
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Category Filter */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[var(--unit-text-muted)] uppercase">Categoría</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2 rounded-unit border border-[var(--unit-border)]/60 bg-[var(--unit-surface)] text-xs text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/40"
                    >
                      <option value="">Todas las categorías</option>
                      {categories.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Unit Filter */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[var(--unit-text-muted)] uppercase">Unidad</label>
                    <select
                      value={unitFilter}
                      onChange={(e) => setUnitFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-unit border border-[var(--unit-border)]/60 bg-[var(--unit-surface)] text-xs text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/40"
                    >
                      <option value="">Todas las unidades</option>
                      <option value="SPA">SPA</option>
                      <option value="BARBERIA">Barbería</option>
                    </select>
                  </div>
                </div>
              }
            />

            <div className="rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] overflow-hidden shadow-unit-sm">
              <DataTable
                data={products}
                columns={columns}
                actions={actions}
                keyExtractor={(row) => row.id}
                loading={isLoading}
                searchPlaceholder=""
                filters={[]}
                emptyMessage="No se encontraron productos registrados para esta unidad o filtro."
              />
            </div>
          </div>
        )}

        {/* Product Detail Drawer */}
        <ProductDetailDrawer
          productId={selectedProductId}
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedProductId(null);
          }}
          onEdit={(prod) => {
            setDrawerOpen(false);
            router.push(`/inventory/products/${prod.id}/edit`);
          }}
        />

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setProductToDelete(null);
          }}
          onConfirm={() => {
            if (productToDelete) {
              deleteMutation.mutate(productToDelete.id);
            }
          }}
          title={productToDelete?.isActive ? 'Desactivar Producto' : 'Reactivar Producto'}
          message={`¿Estás seguro de que deseas ${productToDelete?.isActive ? 'desactivar' : 'reactivar'} el producto "${productToDelete?.name}"?`}
          confirmText={productToDelete?.isActive ? 'Desactivar' : 'Reactivar'}
          type={productToDelete?.isActive ? 'danger' : 'info'}
          isLoading={deleteMutation.isPending}
        />
      </div>
    </div>
  );
}
