import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Edit, Trash2, Package, AlertTriangle, Plus, ArrowDownRight, ArrowUpRight, Eye, X, Home, AlertCircle, Filter, Search, ChevronDown, ChevronUp, DollarSign, Users, TrendingUp, TrendingDown, Calendar, Sparkles, BarChart3, Activity, ShoppingCart, Loader2, CheckCircle, XCircle, Building2, RefreshCw, FileText } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { EmptyStateData } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { InventoryMetrics } from './InventoryMetrics';
import type { Product } from '@/types/product';
import { useToast } from '@/hooks/useToast';

export function InventoryPage(): JSX.Element {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewModal, setViewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { success, error } = useToast();
  
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(true);
  
  // Additional filters (like appointments)
  const [categoryId, setCategoryId] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
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
  const canEdit = user?.role === 'ADMIN'; // RECEPTIONIST can only view, not edit
  const router = useRouter();
  const queryClient = useQueryClient();

  // ✅ MEJORADO: Query con paginación real
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['inventory-products', unitFilter, currentPage, pageSize, categoryId, typeFilter, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (unitFilter) params.set('unit', unitFilter);
      params.set('page', String(currentPage));
      params.set('limit', String(pageSize));
      
      // Add category filter
      if (categoryId) params.set('categoryId', categoryId);
      
      // Add type filter
      if (typeFilter) params.set('type', typeFilter);
      
      // Add search filter
      if (debouncedSearch) params.set('search', debouncedSearch);
      
      const { data } = await api.get(`/api/inventory/products?${params}`);
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const { data } = await api.get('/api/inventory/products/categories');
      return data;
    },
  });

  // Extract data from paginated response
  const products = productsData?.data || [];
  const pagination = productsData?.pagination || {
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  };

  // Query for product movements
  const [movementsPage, setMovementsPage] = useState(1);
  const movementsPageSize = 10;

  const { data: movementsData, isLoading: movementsLoading } = useQuery({
    queryKey: ['product-movements', selectedProduct?.id, movementsPage],
    queryFn: async () => {
      if (!selectedProduct?.id) return { data: [], pagination: { page: 1, total: 0, totalPages: 0 } };
      const { data } = await api.get(`/api/inventory/movements?productId=${selectedProduct.id}&limit=${movementsPageSize}&page=${movementsPage}`);
      return data;
    },
    enabled: !!selectedProduct?.id && viewModal,
  });

  const movements = movementsData?.data || [];
  const movementsPagination = movementsData?.pagination || { page: 1, total: 0, totalPages: 0 };

  // ✅ MEJORADO: Delete mutation con backend real
  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await api.delete(`/api/inventory/products/${productId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      setShowDeleteDialog(false);
      setSelectedProduct(null);
    },
    onError: (error: any) => {
      error(error.message || 'Error al eliminar el producto');
    },
  });

  // ✅ OPTIMIZADO: Helper functions with memoization
  const lowStockCount = useMemo(() => {
    return products.filter((p: Product) => p.stock < p.minStock).length;
  }, [products]);

  // ✅ NUEVO: Cálculo de valor del inventario
  const totalInventoryValue = useMemo(() => {
    return products.reduce((sum: number, p: Product) => sum + (p.costPrice || 0) * p.stock, 0);
  }, [products]);

  // ✅ NUEVO: Cálculo de productos inactivos
  const inactiveCount = useMemo(() => {
    return products.filter((p: Product) => !p.isActive).length;
  }, [products]);

  // ✅ REFACTORIZADO: Category color mapping object
  const getCategoryColor = useCallback((name: string) => {
    const lowerName = name.toLowerCase();
    
    // SPA Categories mapping
    const spaCategories: Record<string, string> = {
      'facial': 'bg-pink-100 text-pink-800',
      'cara': 'bg-pink-100 text-pink-800',
      'masaje': 'bg-purple-100 text-purple-800',
      'relaj': 'bg-purple-100 text-purple-800',
      'corporal': 'bg-purple-100 text-purple-800',
      'manicur': 'bg-blue-100 text-blue-800',
      'uña': 'bg-blue-100 text-blue-800',
      'mano': 'bg-blue-100 text-blue-800',
      'pedicur': 'bg-indigo-100 text-indigo-800',
      'pie': 'bg-indigo-100 text-indigo-800',
      'depil': 'bg-red-100 text-red-800',
      'cera': 'bg-red-100 text-red-800',
      'laser': 'bg-red-100 text-red-800',
      'tratamient': 'bg-green-100 text-green-800',
      'terapia': 'bg-green-100 text-green-800',
    };
    
    // Barbería Categories mapping
    const barberiaCategories: Record<string, string> = {
      'corte': 'bg-amber-100 text-amber-800',
      'cabello': 'bg-amber-100 text-amber-800',
      'peinado': 'bg-amber-100 text-amber-800',
      'barba': 'bg-orange-100 text-orange-800',
      'bigote': 'bg-orange-100 text-orange-800',
      'tinte': 'bg-teal-100 text-teal-800',
      'color': 'bg-teal-100 text-teal-800',
      'decap': 'bg-teal-100 text-teal-800',
    };
    
    // Product Categories mapping
    const productCategories: Record<string, string> = {
      'shampoo': 'bg-cyan-100 text-cyan-800',
      'acondicionador': 'bg-cyan-100 text-cyan-800',
      'crema': 'bg-lime-100 text-lime-800',
      'loción': 'bg-lime-100 text-lime-800',
      'aceite': 'bg-emerald-100 text-emerald-800',
      'serum': 'bg-emerald-100 text-emerald-800',
      'máscara': 'bg-violet-100 text-violet-800',
      'tratamiento': 'bg-violet-100 text-violet-800',
    };
    
    // Check mappings in order of specificity
    for (const [key, color] of Object.entries(spaCategories)) {
      if (lowerName.includes(key)) return color;
    }
    for (const [key, color] of Object.entries(barberiaCategories)) {
      if (lowerName.includes(key)) return color;
    }
    for (const [key, color] of Object.entries(productCategories)) {
      if (lowerName.includes(key)) return color;
    }
    
    // Default colors
    if (lowerName === 'sin categoría') return 'bg-gray-100 text-gray-800';
    return 'bg-sky-100 text-sky-800';
  }, []);

  const getStockStatus = useCallback((product: Product) => {
    if (product.stock === 0) return 'ZERO';
    if (product.stock < product.minStock) return 'LOW';
    if (product.maxStock && product.stock > product.maxStock) return 'HIGH';
    return 'OK';
  }, []);

  const getPriceRange = useCallback((price: number | null) => {
    if (!price) return '';
    if (price < 10) return '0-10';
    if (price < 50) return '10-50';
    if (price < 100) return '50-100';
    if (price < 500) return '100-500';
    return '500+';
  }, []);

  // ✅ ELIMINADO: Client-side filtering - ahora se maneja en backend

  const columns = [
    {
      key: 'name',
      header: 'Producto',
      sortable: true,
      render: (row: Product) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-[var(--unit-text-muted)]" />
          <span className="font-medium text-[var(--unit-text-muted)]">{row.name}</span>
          {row.stock < row.minStock && (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Categoría',
      sortable: true,
      render: (row: Product) => {
        const categoryName = row.category?.name || 'Sin categoría';
        
        if (categoryName === '—') {
          return <span className="text-[var(--unit-text-muted)]">—</span>;
        }
        
        return (
          <span className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            getCategoryColor(categoryName)
          )}>
            {categoryName}
          </span>
        );
      },
    },
    {
      key: 'unit',
      header: 'Unidad',
      render: (row: Product) => (
        <span className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          row.unit === 'SPA'
            ? 'bg-purple-100 text-purple-800'
            : 'bg-red-100 text-red-800'
        )}>
          {row.unit === 'BARBERIA' ? 'Barbería' : 'SPA'}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (row: Product) => (
        <span className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          row.type === 'INTERNAL_USE'
            ? 'bg-orange-100 text-orange-800'
            : row.type === 'FOR_SALE'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-green-100 text-green-800'
        )}>
          {row.type === 'INTERNAL_USE' ? 'Uso interno' : 
           row.type === 'FOR_SALE' ? 'Para venta' : 'Ambos'}
        </span>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      sortable: true,
      render: (row: Product) => (
        <span className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          row.stock === 0 
            ? 'bg-red-100 text-red-800'
            : row.stock < row.minStock 
            ? 'bg-amber-100 text-amber-800' 
            : 'bg-green-100 text-green-800'
        )}>
          {row.stock} {row.measureUnit}
        </span>
      ),
    },
    {
      key: 'minStock',
      header: 'Mínimo',
      sortable: true,
      render: (row: Product) => (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800">
          {row.minStock} {row.measureUnit}
        </span>
      ),
    },
    {
      key: 'salePrice',
      header: 'Precio Venta',
      sortable: true,
      render: (row: Product) =>
        row.salePrice ? (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 font-bold">
            S/ {row.salePrice.toFixed(2)}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
            —
          </span>
        ),
    },
    {
      key: 'isActive',
      header: 'Estado',
      render: (row: Product) => (
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
      key: 'timesVended',
      header: 'Vendidos',
      sortable: true,
      render: (row: Product) => (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-800">
          {row.timesVended || 0}
        </span>
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
      key: 'dateFilter',
      label: 'Fecha',
      type: 'select' as const,
      options: [
        { label: 'Todas', value: '' },
        { label: 'Hoy', value: 'TODAY' },
        { label: 'Esta semana', value: 'WEEK' },
        { label: 'Este mes', value: 'MONTH' },
      ],
    },
    {
      key: 'unit',
      label: 'Unidad',
      type: 'select' as const,
      options: [
        { label: 'Todas', value: '' },
        { label: 'SPA', value: 'SPA' },
        { label: 'Barbería', value: 'BARBERIA' },
      ],
    },
    {
      key: 'type',
      label: 'Tipo',
      type: 'select' as const,
      options: [
        { label: 'Todos', value: '' },
        { label: 'Productos', value: 'PRODUCT' },
        { label: 'Servicios', value: 'SERVICE' },
      ],
    },
    {
      key: 'stockStatus',
      label: 'Estado de Stock',
      type: 'select' as const,
      options: [
        { label: 'Todos', value: '' },
        { label: 'Sin stock', value: 'ZERO' },
        { label: 'Stock bajo', value: 'LOW' },
        { label: 'Stock normal', value: 'OK' },
        { label: 'Stock excedente', value: 'HIGH' },
      ],
    },
    {
      key: 'priceRange',
      label: 'Rango de Precio',
      type: 'select' as const,
      options: [
        { label: 'Todos', value: '' },
        { label: 'Menos de S/ 10', value: '0-10' },
        { label: 'S/ 10 - S/ 50', value: '10-50' },
        { label: 'S/ 50 - S/ 100', value: '50-100' },
        { label: 'Más de S/ 100', value: '500+' },
      ],
    },
    {
      key: 'hasPrice',
      label: 'Con precio definido',
      type: 'checkbox' as const,
    },
    {
      key: 'lowStock',
      label: 'Stock crítico',
      type: 'checkbox' as const,
    },
    {
      key: 'hasBarcode',
      label: 'Con código de barras',
      type: 'checkbox' as const,
    },
  ];

  const actions = [
    {
      label: 'Ver',
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: Product) => {
        setSelectedProduct(row);
        setMovementsPage(1); // Reset to first page
        setViewModal(true);
      },
      className: 'text-[var(--unit-primary)] hover:bg-[var(--unit-primary)]/10',
    },
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: (row: Product) => {
        router.push(`/inventory/products/${row.id}/edit`);
      },
      className: 'text-[var(--unit-warning)] hover:bg-[var(--unit-warning)]/10',
      disabled: (row: Product) => !canEdit,
    },
    {
      label: 'Eliminar',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: Product) => {
        if (row.isActive) {
          setSelectedProduct(row);
          setShowDeleteDialog(true);
        } else {
          // Reactivate inactive products
          deleteMutation.mutate(row.id);
        }
      },
      className: 'text-[var(--unit-error)] hover:bg-[var(--unit-error)]/10',
      disabled: (row: Product) => !canEdit,
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
                Sistema de Inventario
              </span>
            </div>
            <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">Productos</h1>
            <p className="text-[var(--unit-text-muted)]">
              Gestiona productos y servicios con control total
            </p>
          </div>

          {/* Inventory Metrics - Nueva sección de métricas espectaculares */}
          <InventoryMetrics products={products} />

          {/* Enhanced Action Buttons - Idéntico a Appointments pero adaptado para Inventario */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {canEdit && (
              <>
                <Link href="/inventory/products/new" className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white font-bold shadow-lg border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
                  <Plus className="h-5 w-5" />
                  Nuevo Producto
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
                <Link href="/inventory/suppliers" className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-lg border-2 border-blue-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
                  <Building2 className="h-5 w-5" />
                  Proveedores
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

        {/* Enhanced Inventory Filters */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6 mb-8">
          {/* Filter Header */}
          <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Filtros de Inventario</h3>
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

              {/* Additional Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Categoría</label>
                  <select
                    value={categoryId}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">Todas las categorías</option>
                    {categories?.map((category: any) => (
                      <option key={category.id} value={category.id}>
                        {category.name} ({category.unit})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Tipo</label>
                  <select
                    value={typeFilter}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="">Todos los tipos</option>
                    <option value="INTERNAL_USE">Uso interno</option>
                    <option value="FOR_SALE">Para venta</option>
                    <option value="BOTH">Ambos</option>
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
                      placeholder="Buscar por nombre de producto..."
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
              {(unitFilter || categoryId || typeFilter || search) && (
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
                        {categoryId && categories && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700 border border-sky-200">
                            Categoría: {categories.find((c: any) => c.id === categoryId)?.name}
                          </span>
                        )}
                        {typeFilter && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 border border-red-200">
                            Tipo: {typeFilter === 'INTERNAL_USE' ? 'Uso interno' : 
                                   typeFilter === 'FOR_SALE' ? 'Para venta' : 
                                   typeFilter === 'BOTH' ? 'Ambos' : typeFilter}
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
                        setCategoryId('');
                        setTypeFilter('');
                        setSearch('');
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

        {/* Inventory Table */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6">
          {/* Table Header */}
          <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Lista de Productos</h3>
                  <p className="text-sm text-[var(--unit-text-muted)]">Gestiona tu inventario</p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-[var(--unit-accent)]/20 px-3 py-1.5 text-sm font-bold text-[var(--unit-accent)] border border-[var(--unit-accent)]/30 shadow-sm">
                {products.length} productos
              </span>
            </div>
          </div>

          {/* Table */}
          <DataTable
            columns={columns}
            data={products}
            keyExtractor={(row) => row.id}
            loading={isLoading}
            searchPlaceholder="" // Hidden since we have custom search
            filters={[]} // Hidden since we have custom filters
            actions={actions}
            emptyMessage="No se encontraron productos con los filtros aplicados."
            disableInternalPagination={true}
            pagination={pagination}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>

        {/* Delete Confirmation Modal - Estilo Original Premium */}
        {showDeleteDialog && selectedProduct && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteDialog(false);
              setSelectedProduct(null);
            }
          }}>
            <div className="relative overflow-hidden rounded-2xl border-2 border-red-500/50 bg-gradient-to-br from-red-50/95 to-red-100/85 backdrop-blur-md shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-30 pointer-events-none">
                <div className="h-full w-full bg-repeat" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ef4444' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
              </div>

              {/* Header - Estándar consistente */}
              <div className="relative mb-6 flex items-start justify-between gap-4">
                {/* Background gradient for header - Consistente con Modal.tsx */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--unit-accent)]/20 to-transparent"></div>
                
                <div className="relative z-10 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                    <Trash2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-red-900">Desactivar Producto</h3>
                    <p className="text-sm text-red-700">Esta acción es reversible</p>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setSelectedProduct(null);
                    setDeleteConfirm(null);
                  }}
                  className="relative z-10 shrink-0 rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)]/50 p-2 text-[var(--unit-text-muted)] transition-all duration-200 hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10 hover:text-[var(--unit-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
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
                        ¿Estás seguro de que deseas desactivar el producto "{selectedProduct.name}"?
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        Esta acción se puede deshacer activando el producto nuevamente. El producto será marcado como inactivo pero no se eliminará permanentemente.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div className="rounded-xl border-2 border-red-200/30 bg-gradient-to-br from-white/50 to-white/30 p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Producto</span>
                      <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                        {selectedProduct.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Precio Venta</span>
                      <span className="text-sm font-bold text-gray-900">
                        S/ {selectedProduct.salePrice?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Stock Actual</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedProduct.stock} unidades
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Unidad</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedProduct.unit === 'BARBERIA' ? 'Barbería' : 'SPA'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setSelectedProduct(null);
                  }}
                  className="flex-1 rounded-xl border-2 border-red-300/50 px-6 py-3 text-sm font-medium text-red-700 bg-white/80 hover:bg-red-50 transition-all hover:shadow-lg active:scale-[0.98]"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    deleteMutation.mutate(selectedProduct.id);
                  }}
                  disabled={deleteMutation.isPending}
                  className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold shadow-lg border-2 border-red-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                  {deleteMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                      Desactivando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Desactivar Producto
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* View Details Modal - Exacto Estilo Detalles de Servicio */}
        {viewModal && selectedProduct && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              {/* Background Pattern - Exacto estilo Servicio */}
              <div className="absolute inset-0 opacity-5">
                <div className="h-full w-full bg-repeat" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
              </div>
              
              <div className="relative">
                {/* Enhanced Header - Estándar consistente */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                      <Eye className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[var(--unit-text)]">Detalles del Producto</h3>
                      <p className="text-sm text-[var(--unit-text-muted)]">ID: {selectedProduct.id}</p>
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

                {/* Enhanced Content Grid - Exacto estilo Servicio */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Enhanced General Information - Glassmorphism Card */}
                  <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                    <div className="relative">
                      {/* Card Header */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                          <Package className="h-4 w-4 text-[var(--unit-accent)]" />
                        </div>
                        <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Información General</h4>
                      </div>

                      {/* Enhanced Product Info List */}
                      <div className="space-y-4">
                        {/* Name */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[var(--unit-text)]">Nombre</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30 max-w-xs truncate">
                            {selectedProduct.name}
                          </span>
                        </div>

                        {/* Type */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[var(--unit-text)]">Tipo</span>
                          </div>
                          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold border ${
                            selectedProduct.type === 'INTERNAL_USE' ? 'bg-orange-100 text-orange-700 border-orange-200' : 
                            selectedProduct.type === 'FOR_SALE' ? 'bg-green-100 text-green-700 border-green-200' : 
                            'bg-blue-100 text-blue-700 border-blue-200'
                          }`}>
                            {selectedProduct.type === 'INTERNAL_USE' ? (
                              <>
                                <Home className="h-3 w-3" />
                                Uso interno
                              </>
                            ) : selectedProduct.type === 'FOR_SALE' ? (
                              <>
                                <ShoppingCart className="h-3 w-3" />
                                Para venta
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-3 w-3" />
                                Ambos
                              </>
                            )}
                          </span>
                        </div>

                        {/* Unit */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Unidad</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                            {selectedProduct.unit}
                          </span>
                        </div>

                        {/* Category */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Categoría</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                            {selectedProduct.category?.name || 'Sin categoría'}
                          </span>
                        </div>

                        {/* Barcode */}
                        {selectedProduct.barcode && (
                          <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-[var(--unit-text)]">Código Barras</span>
                            </div>
                            <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30 font-mono text-xs">
                              {selectedProduct.barcode}
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
                            selectedProduct.isActive 
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                              : 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {selectedProduct.isActive ? 'Activo' : 'Inactivo'}
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
                        <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Información de Stock</h4>
                      </div>

                      {/* Enhanced Stock List */}
                      <div className="space-y-4">
                        {/* Current Stock */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 transition-all">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm font-bold text-emerald-800">Stock Actual</span>
                          </div>
                          <div className="text-right">
                            <span className={`font-bold text-emerald-800 bg-white px-3 py-1 rounded-lg border-2 border-emerald-300/30 shadow-lg tabular-nums ${
                              selectedProduct.stock < selectedProduct.minStock ? 'text-amber-600 border-amber-300/30' : ''
                            }`}>
                              {selectedProduct.stock} {selectedProduct.measureUnit}
                            </span>
                            {selectedProduct.stock < selectedProduct.minStock && (
                              <p className="text-xs text-amber-700 font-medium mt-1">⚠️ Stock crítico</p>
                            )}
                          </div>
                        </div>

                        {/* Min Stock */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border-2 border-amber-500/30 bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 transition-all">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <span className="text-sm font-bold text-amber-800">Stock Mínimo</span>
                          </div>
                          <span className="font-bold text-amber-800 bg-white px-3 py-1 rounded-lg border-2 border-amber-300/30 shadow-lg tabular-nums">
                            {selectedProduct.minStock} {selectedProduct.measureUnit}
                          </span>
                        </div>

                        {/* Max Stock */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border-2 border-indigo-500/30 bg-gradient-to-r from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 transition-all">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-indigo-600" />
                            <span className="text-sm font-bold text-indigo-800">Stock Máximo</span>
                          </div>
                          <span className="font-bold text-indigo-800 bg-white px-3 py-1 rounded-lg border-2 border-indigo-300/30 shadow-lg tabular-nums">
                            {selectedProduct.maxStock ? `${selectedProduct.maxStock} ${selectedProduct.measureUnit}` : 'Sin límite'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Price and Status - Glassmorphism Card */}
                  <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                    <div className="relative">
                      {/* Card Header */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                          <DollarSign className="h-4 w-4 text-[var(--unit-accent)]" />
                        </div>
                        <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Precios y Estado</h4>
                      </div>

                      {/* Enhanced Price and Status List */}
                      <div className="space-y-4">
                        {/* Sale Price */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border-2 border-green-500/30 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 transition-all">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-bold text-green-800">Precio Venta</span>
                          </div>
                          <span className="font-bold text-green-800 bg-white px-3 py-1 rounded-lg border-2 border-green-300/30 shadow-lg tabular-nums">
                            {selectedProduct.salePrice ? `S/ ${selectedProduct.salePrice.toFixed(2)}` : 'No definido'}
                          </span>
                        </div>

                        {/* Cost Price */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border-2 border-red-500/30 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 transition-all">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-bold text-red-800">Precio Costo</span>
                          </div>
                          <span className="font-bold text-red-800 bg-white px-3 py-1 rounded-lg border-2 border-red-300/30 shadow-lg tabular-nums">
                            {selectedProduct.costPrice ? `S/ ${selectedProduct.costPrice.toFixed(2)}` : 'No definido'}
                          </span>
                        </div>

                        {/* Status */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border-2 border-purple-500/30 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 transition-all">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-bold text-purple-800">Estado</span>
                          </div>
                          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold border ${
                            selectedProduct.isActive
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'bg-red-100 text-red-700 border-red-200'
                          }`}>
                            {selectedProduct.isActive ? (
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

                {/* Enhanced Recent Movements - Glassmorphism Card */}
                <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                  <div className="relative">
                    {/* Enhanced Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                          <Activity className="h-4 w-4 text-[var(--unit-accent)]" />
                        </div>
                        <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">
                          Movimientos de Stock
                        </h4>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-[var(--unit-accent)]/20 px-3 py-1.5 text-xs font-bold text-[var(--unit-accent)] border border-[var(--unit-accent)]/30 shadow-sm">
                        {movements.length} movimientos
                      </span>
                    </div>

                    {/* Enhanced Movements List */}
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                      {movements.length === 0 ? (
                        <EmptyStateData
                          title="No hay movimientos registrados"
                          description="No se encontraron movimientos de stock para este producto. Los movimientos aparecerán aquí cuando se realicen entradas o salidas de inventario."
                          action={
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => window.location.href = '/inventory/movements'}
                            >
                              Ver todos los movimientos
                            </Button>
                          }
                        />
                      ) : (
                        movements.slice(0, 10).map((movement: any) => (
                          <div key={movement.id} className="group/movement relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/20 bg-gradient-to-br from-white to-[var(--unit-surface)] p-4 hover:border-[var(--unit-accent)]/30 hover:shadow-lg transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover/movement:opacity-100 transition-opacity rounded-xl"></div>
                            <div className="relative">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${
                                      movement.type === 'IN' 
                                        ? 'bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30'
                                        : 'bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30'
                                    }`}>
                                      {movement.type === 'IN' ? (
                                        <Package className="h-3 w-3 text-green-600" />
                                      ) : (
                                        <Package className="h-3 w-3 text-red-600" />
                                      )}
                                    </div>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${
                                      movement.type === 'IN' ? 'text-green-800' : 'text-red-800'
                                    }`}>
                                      {movement.type === 'IN' ? 'Entrada' : 'Salida'}
                                    </span>
                                    {movement.referenceNumber && (
                                      <span className="text-xs text-[var(--unit-text-muted)]">
                                        #{movement.referenceNumber}
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm">
                                      <Calendar className="h-3 w-3 text-[var(--unit-text-muted)]" />
                                      <span className="text-[var(--unit-text-muted)]">
                                        {new Date(movement.createdAt).toLocaleDateString('es-PE', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric'
                                        })}
                                      </span>
                                      <span className="text-[var(--unit-text-muted)]">a las</span>
                                      <span className="text-[var(--unit-text-muted)]">
                                        {new Date(movement.createdAt).toLocaleTimeString('es-PE', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-sm">
                                      <Users className="h-3 w-3 text-[var(--unit-text-muted)]" />
                                      <span className="text-[var(--unit-text-muted)]">Usuario:</span>
                                      <span className="font-medium text-[var(--unit-text)]">
                                        {movement.user?.name || 'Sistema'}
                                      </span>
                                    </div>
                                    
                                    {movement.reason && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <FileText className="h-3 w-3 text-[var(--unit-text-muted)]" />
                                        <span className="text-[var(--unit-text-muted)]">Motivo:</span>
                                        <span className="font-medium text-[var(--unit-text)]">
                                          {movement.reason}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="text-right">
                                  <div className="space-y-1">
                                    <div className={`text-sm font-bold ${
                                      movement.type === 'IN' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {movement.type === 'IN' ? '+' : '-'}{movement.quantity} {movement.quantity === 1 ? 'unidad' : 'unidades'}
                                    </div>
                                    <div className="text-xs text-[var(--unit-text-muted)]">
                                      Stock: {movement.stockAfter}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Enhanced Footer Actions - Exacto estilo Servicio */}
                <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-t border-[var(--unit-border)]/30 -mx-8 -mb-8 mt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                        <Package className="h-4 w-4 text-[var(--unit-accent)]" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--unit-text-muted)]">Resumen del Producto</p>
                        <p className="text-sm font-bold text-[var(--unit-text)]">
                          {selectedProduct.name} • {selectedProduct.stock} {selectedProduct.measureUnit} • {selectedProduct.unit}
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
