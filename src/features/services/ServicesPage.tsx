import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Select, Button } from '@/components/ui';
import { EmptyStateData } from '@/components/ui/EmptyState';
import { Plus, Edit, Trash2, FolderPlus, Clock, DollarSign, Tag, Building2, Eye, X, AlertCircle, Filter, Search, ChevronDown, ChevronUp, Activity, TrendingUp, TrendingDown, CheckCircle, Package } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { useToast } from '@/hooks/useToast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import type { Service, ServiceCategory } from '@/types/service';
import { ServicesMetrics } from './ServicesMetrics';

export function ServicesPage(): JSX.Element {
  const [unit, setUnit] = useState<string>('');
  const [categoryId, setServiceCategoryId] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
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
  const [viewModal, setViewModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [page, setPage] = useState(1);
  const { success, error } = useToast();

  // Reset modal states when closed
  useEffect(() => {
    if (!viewModal) {
      setSelectedService(null);
    }
  }, [viewModal]);
  
  // Date range filter states (like inventory)
  const [dateFrom, setDateFrom] = useState<Date>(startOfDay(subDays(new Date(), 7)));
  const [dateTo, setDateTo] = useState<Date>(endOfDay(new Date()));
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(true);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: servicesData, isLoading } = useQuery({
    queryKey: ['services', unit, categoryId, unitFilter, dateFrom, dateTo, debouncedSearch, statusFilter, page],
    queryFn: async (): Promise<{ data: Service[], pagination: any }> => {
      const params = new URLSearchParams();
      if (unit) params.set('unit', unit);
      if (categoryId) params.set('categoryId', categoryId);
      params.set('page', String(page));
      params.set('limit', '15');
      
      // Add unit filter from DateRangeFilter
      if (unitFilter) params.set('unitFilter', unitFilter);
      
      // Add date range filters
      if (dateFrom) params.set('dateFrom', dateFrom.toISOString());
      if (dateTo) params.set('dateTo', dateTo.toISOString());
      
      // Add search filter
      if (debouncedSearch) params.set('search', debouncedSearch);
      
      // Add status filter
      if (statusFilter) params.set('isActive', statusFilter === 'active' ? 'true' : 'false');
      
      const { data } = await api.get(`/api/services?${params}`);
      return data;
    },
  });

  // Extract services array from paginated response
  const services = servicesData?.data || [];
  const pagination = servicesData?.pagination;

  const { data: categories } = useQuery({
    queryKey: ['service-categories'],
    queryFn: async (): Promise<ServiceCategory[]> => {
      const { data } = await api.get<ServiceCategory[]>('/api/services/categories');
      return data;
    },
  });

  
  const deleteServiceCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/api/services/categories/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      success('Categoría eliminada correctamente');
    },
    onError: (error: any) => {
      error(error.message || 'Error al eliminar la categoría');
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const { data } = await api.delete(`/api/services/${serviceId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setShowDeleteDialog(false);
      setSelectedService(null);
    },
    onError: (error: any) => {
      error(error.message || 'Error al eliminar el servicio');
    },
  });

  // Query for service movements
  const { data: movements = [] } = useQuery({
    queryKey: ['service-movements', selectedService?.id],
    queryFn: async () => {
      if (!selectedService?.id) return [];
      const { data } = await api.get(`/api/services/${selectedService.id}/movements`);
      return data;
    },
    enabled: !!selectedService?.id && viewModal,
  });

  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === 'ADMIN'; // RECEPTIONIST can only view, not edit

  // Helper functions
  const getPriceRange = (price: number) => {
    if (price < 50) return '0-50';
    if (price < 100) return '50-100';
    if (price < 200) return '100-200';
    if (price < 500) return '200-500';
    return '500+';
  };

  const getDurationRange = (duration: number) => {
    if (duration < 30) return '0-30';
    if (duration < 60) return '30-60';
    if (duration < 90) return '60-90';
    if (duration < 120) return '90-120';
    return '120+';
  };

  // ✅ MEJORADO: getServiceCategoryColor con objeto de mapeo
  const getServiceCategoryColor = (name: string) => {
    const categoryColors = {
      // SPA Categories
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
      
      // Barbería Categories
      'corte': 'bg-amber-100 text-amber-800',
      'cabello': 'bg-amber-100 text-amber-800',
      'peinado': 'bg-amber-100 text-amber-800',
      'barba': 'bg-orange-100 text-orange-800',
      'bigote': 'bg-orange-100 text-orange-800',
      'tinte': 'bg-teal-100 text-teal-800',
      'color': 'bg-teal-100 text-teal-800',
      'decap': 'bg-teal-100 text-teal-800',
      
      // Default
      'sin categoría': 'bg-gray-100 text-gray-800',
    } as const;

    const lowerName = name.toLowerCase();
    
    // Buscar coincidencia exacta primero
    if (categoryColors[lowerName as keyof typeof categoryColors]) {
      return categoryColors[lowerName as keyof typeof categoryColors];
    }
    
    // Buscar coincidencia parcial
    for (const [key, color] of Object.entries(categoryColors)) {
      if (key !== 'sin categoría' && lowerName.includes(key)) {
        return color;
      }
    }
    
    // Default color
    return 'bg-cyan-100 text-cyan-800';
  };

  const columns = [
    {
      key: 'name',
      header: 'Servicio',
      sortable: true,
      render: (row: Service) => (
        <div>
          <div className="font-medium text-[var(--unit-text-muted)]">{row.name}</div>
          {row.description && (
            <div className="text-sm text-[var(--unit-text-muted)]">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Categoría',
      sortable: true,
      render: (row: Service) => {
        const categoryName = row.category?.name || 'Sin categoría';
        
        // Assign colors based on category name
        const getServiceCategoryColor = (name: string) => {
          const lowerName = name.toLowerCase();
          
          // SPA Categories
          if (lowerName.includes('facial') || lowerName.includes('cara')) return 'bg-pink-100 text-pink-800';
          if (lowerName.includes('masaje') || lowerName.includes('relaj') || lowerName.includes('corporal')) return 'bg-purple-100 text-purple-800';
          if (lowerName.includes('manicur') || lowerName.includes('uña') || lowerName.includes('mano')) return 'bg-blue-100 text-blue-800';
          if (lowerName.includes('pedicur') || lowerName.includes('pie')) return 'bg-indigo-100 text-indigo-800';
          if (lowerName.includes('depil') || lowerName.includes('cera') || lowerName.includes('laser')) return 'bg-red-100 text-red-800';
          if (lowerName.includes('tratamient') || lowerName.includes('terapia')) return 'bg-green-100 text-green-800';
          
          // Barbería Categories
          if (lowerName.includes('corte') || lowerName.includes('cabello') || lowerName.includes('peinado')) return 'bg-amber-100 text-amber-800';
          if (lowerName.includes('barba') || lowerName.includes('bigote') || lowerName.includes('facial')) return 'bg-orange-100 text-orange-800';
          if (lowerName.includes('tinte') || lowerName.includes('color') || lowerName.includes('decap')) return 'bg-teal-100 text-teal-800';
          
          // Default colors
          if (lowerName === 'sin categoría') return 'bg-gray-100 text-gray-800';
          return 'bg-cyan-100 text-cyan-800';
        };
        
        return (
          <span className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            getServiceCategoryColor(categoryName)
          )}>
            {categoryName}
          </span>
        );
      },
    },
    {
      key: 'unit',
      header: 'Unidad',
      render: (row: Service) => (
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
      key: 'price',
      header: 'Precio',
      sortable: true,
      render: (row: Service) => (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 font-bold">
          S/ {row.price.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'durationMin',
      header: 'Duración',
      sortable: true,
      render: (row: Service) => (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
          {row.durationMin} min
        </span>
      ),
    },
    {
      key: 'timesVended',
      header: 'Vendidos',
      sortable: true,
      render: (row: Service) => (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-800">
          {row.timesVended}
        </span>
      ),
    },
    {
      key: 'isComboEligible',
      header: 'Combo',
      render: (row: Service) => (
        <span className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          row.isComboEligible
            ? 'bg-teal-100 text-teal-800'
            : 'bg-gray-100 text-gray-800'
        )}>
          {row.isComboEligible ? 'Sí' : 'No'}
        </span>
      ),
    },
  ];

  const filters = [
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
      key: 'categoryId',
      label: 'Categoría',
      type: 'select' as const,
      options: [
        { label: 'Todas', value: '' },
        ...(categories?.map(cat => ({ label: cat.name, value: cat.id })) || []),
      ],
    },
    {
      key: 'priceRange',
      label: 'Rango de Precio',
      type: 'select' as const,
      options: [
        { label: 'Todos', value: '' },
        { label: 'Menos de S/ 50', value: '0-50' },
        { label: 'S/ 50 - S/ 100', value: '50-100' },
        { label: 'S/ 100 - S/ 200', value: '100-200' },
        { label: 'S/ 200 - S/ 500', value: '200-500' },
        { label: 'Más de S/ 500', value: '500+' },
      ],
    },
    {
      key: 'durationRange',
      label: 'Duración',
      type: 'select' as const,
      options: [
        { label: 'Todas', value: '' },
        { label: 'Menos de 30 min', value: '0-30' },
        { label: '30 - 60 min', value: '30-60' },
        { label: '60 - 90 min', value: '60-90' },
        { label: '90 - 120 min', value: '90-120' },
        { label: 'Más de 120 min', value: '120+' },
      ],
    },
    {
      key: 'hasDescription',
      label: 'Con descripción',
      type: 'checkbox' as const,
    },
    {
      key: 'hasServiceCategory',
      label: 'Con categoría',
      type: 'checkbox' as const,
    },
    {
      key: 'isComboEligible',
      label: 'Apto para combo',
      type: 'checkbox' as const,
    },
    {
      key: 'hasSales',
      label: 'Con ventas',
      type: 'checkbox' as const,
    },
  ];

  const actions = [
    {
      label: 'Ver',
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: Service) => {
        setSelectedService(row);
        setViewModal(true);
      },
      className: 'text-[var(--unit-primary)] hover:bg-[var(--unit-primary)]/10',
    },
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: (row: Service) => {
        router.push(`/services/${row.id}/edit`);
      },
      className: 'text-[var(--unit-warning)] hover:bg-[var(--unit-warning)]/10',
      disabled: (row: Service) => !canEdit,
    },
    {
      label: 'Eliminar',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: Service) => {
        setSelectedService(row);
        setShowDeleteDialog(true);
      },
      className: 'text-[var(--unit-error)] hover:bg-[var(--unit-error)]/10',
      disabled: (row: Service) => !canEdit,
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
        {/* Enhanced Header - Exacto estilo InventoryPage */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-4">
              <div className="h-2 w-2 rounded-full bg-[var(--unit-accent)] animate-pulse"></div>
              <span className="text-sm font-medium text-[var(--unit-text)]">
                Gestión de Servicios
              </span>
            </div>
            <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">Servicios</h1>
            <p className="text-[var(--unit-text-muted)]">
              Administra el catálogo de servicios y tratamientos
            </p>
          </div>

          {/* Services Metrics - Nueva sección de métricas espectaculares */}
          <ServicesMetrics services={services} />

          {/* Enhanced Action Buttons - Exacto estilo InventoryPage */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4">
            {canEdit && (
              <Link href="/services/new" className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white font-bold shadow-lg border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
                <Plus className="h-5 w-5" />
                Nuevo Servicio
              </Link>
            )}
          </div>
        </div>

        {/* Enhanced Services Filters - Exacto estilo InventoryPage */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6 mb-8">
          {/* Filter Header */}
          <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Filtros de Servicios</h3>
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
                {/* ServiceCategory Filter */}
                <div>
                  <Select
                    label="Categoría"
                    options={[
                      { value: '', label: 'Todas las categorías' },
                      ...(categories?.map((category: ServiceCategory) => ({
                        value: category.id,
                        label: `${category.name} (${category.unit})`
                      })) || [])
                    ]}
                    value={categoryId}
                    onChange={(e) => setServiceCategoryId(e.target.value)}
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <Select
                    label="Estado"
                    options={[
                      { value: '', label: 'Todos los estados' },
                      { value: 'active', label: 'Activos' },
                      { value: 'inactive', label: 'Inactivos' }
                    ]}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  />
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
                      placeholder="Buscar por nombre de servicio..."
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
              {(unitFilter || categoryId || search || statusFilter) && (
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
                            Categoría: {categories.find((c: ServiceCategory) => c.id === categoryId)?.name}
                          </span>
                        )}
                        {statusFilter && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 border border-purple-200">
                            Estado: {statusFilter === 'active' ? 'Activos' : 'Inactivos'}
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
                        setServiceCategoryId('');
                        setSearch('');
                        setStatusFilter('');
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

        {/* Services Table - Exacto estilo InventoryPage */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6">
          {/* Table Header */}
          <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <Tag className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Lista de Servicios</h3>
                  <p className="text-sm text-[var(--unit-text-muted)]">Gestiona tu catálogo de servicios</p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-[var(--unit-accent)]/20 px-3 py-1.5 text-sm font-bold text-[var(--unit-accent)] border border-[var(--unit-accent)]/30 shadow-sm">
                {services.length} servicios
              </span>
            </div>
          </div>

          {/* Table */}
          <DataTable
            columns={columns}
            data={services}
            keyExtractor={(row) => row.id}
            loading={isLoading}
            searchPlaceholder=""
            filters={[]}
            actions={actions}
            emptyMessage="No se encontraron servicios con los filtros aplicados."
            disableInternalPagination={true}
            pagination={pagination}
            onPageChange={(page) => setPage(page)}
            className="rounded-xl"
          />
        </div>
      </div>

        {/* Delete Confirmation Modal - Estilo Original Premium */}
        {showDeleteDialog && selectedService && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteDialog(false);
              setSelectedService(null);
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
                    <h3 className="text-lg font-bold text-red-900">Eliminar Servicio</h3>
                    <p className="text-sm text-red-700">Esta acción es permanente</p>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setSelectedService(null);
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
                        ¿Estás seguro de que deseas eliminar el servicio "{selectedService.name}"?
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        Esta acción no se puede deshacer y el servicio será eliminado permanentemente del sistema.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Service Info */}
                <div className="rounded-xl border-2 border-red-200/30 bg-gradient-to-br from-white/50 to-white/30 p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Servicio</span>
                      <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                        {selectedService.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Precio</span>
                      <span className="text-sm font-bold text-gray-900">
                        S/ {selectedService.price?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Duración</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedService.durationMin} min
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
                    setSelectedService(null);
                  }}
                  className="flex-1 rounded-xl border-2 border-red-300/50 px-6 py-3 text-sm font-medium text-red-700 bg-white/80 hover:bg-red-50 transition-all hover:shadow-lg active:scale-[0.98]"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    deleteServiceMutation.mutate(selectedService.id);
                  }}
                  disabled={deleteServiceMutation.isPending}
                  className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold shadow-lg border-2 border-red-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                  {deleteServiceMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                      Eliminando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Eliminar Servicio
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* View Details Modal - Premium Glassmorphism */}
      {viewModal && selectedService && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Background Pattern */}
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
                    <h3 className="text-xl font-bold text-[var(--unit-text)]">Detalles del Servicio</h3>
                    <p className="text-sm text-[var(--unit-text-muted)]">{selectedService.name}</p>
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

              {/* Enhanced Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Enhanced Basic Information - Glassmorphism Card */}
                <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                  <div className="relative">
                    {/* Card Header */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                        <Eye className="h-4 w-4 text-[var(--unit-accent)]" />
                      </div>
                      <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Información General</h4>
                    </div>

                    {/* Enhanced Service Info List */}
                    <div className="space-y-4">
                      {/* Name */}
                      <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[var(--unit-text)]">Nombre</span>
                        </div>
                        <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30 max-w-xs truncate">
                          {selectedService.name}
                        </span>
                      </div>

                      {/* Description */}
                      {selectedService.description && (
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[var(--unit-text)]">Descripción</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30 max-w-xs truncate">
                            {selectedService.description}
                          </span>
                        </div>
                      )}

                      {/* Unit */}
                      <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-[var(--unit-text-muted)]" />
                          <span className="text-sm font-medium text-[var(--unit-text)]">Unidad</span>
                        </div>
                        <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                          {selectedService.unit}
                        </span>
                      </div>

                      {/* ServiceCategory */}
                      <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-[var(--unit-text-muted)]" />
                          <span className="text-sm font-medium text-[var(--unit-text)]">Categoría</span>
                        </div>
                        <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                          {selectedService.category?.name || 'Sin categoría'}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-[var(--unit-text-muted)]" />
                          <span className="text-sm font-medium text-[var(--unit-text)]">Estado</span>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold border ${
                          selectedService.isActive 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                            : 'bg-gray-100 text-gray-800 border-gray-200'
                        }`}>
                          {selectedService.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Pricing and Duration - Glassmorphism Card */}
                <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                  <div className="relative">
                    {/* Card Header */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                        <DollarSign className="h-4 w-4 text-[var(--unit-accent)]" />
                      </div>
                      <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Precios y Duración</h4>
                    </div>

                    {/* Enhanced Pricing List */}
                    <div className="space-y-4">
                      {/* Price */}
                      <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 transition-all">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm font-bold text-emerald-800">Precio</span>
                        </div>
                        <span className="font-bold text-emerald-800 bg-white px-3 py-1 rounded-lg border-2 border-emerald-300/30 shadow-lg">
                          S/ {selectedService.price.toFixed(2)}
                        </span>
                      </div>

                      {/* Duration */}
                      <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-[var(--unit-text-muted)]" />
                          <span className="text-sm font-medium text-[var(--unit-text)]">Duración</span>
                        </div>
                        <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                          {selectedService.durationMin} minutos
                        </span>
                      </div>

                      {/* Combo Eligible */}
                      <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-[var(--unit-text-muted)]" />
                          <span className="text-sm font-medium text-[var(--unit-text)]">Combo Eligible</span>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold border ${
                          selectedService.isComboEligible 
                            ? 'bg-blue-100 text-blue-800 border-blue-200' 
                            : 'bg-gray-100 text-gray-800 border-gray-200'
                        }`}>
                          {selectedService.isComboEligible ? 'Sí' : 'No'}
                        </span>
                      </div>

                      {/* Times Vended */}
                      <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border-2 border-[var(--unit-primary)]/30 bg-gradient-to-r from-[var(--unit-primary)]/5 to-[var(--unit-accent)]/5 hover:from-[var(--unit-primary)]/10 hover:to-[var(--unit-accent)]/10 transition-all">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-[var(--unit-primary)]" />
                          <span className="text-sm font-bold text-[var(--unit-primary)]">Veces Vendido</span>
                        </div>
                        <span className="font-bold text-[var(--unit-primary)] bg-white px-3 py-1 rounded-lg border-2 border-[var(--unit-primary)]/30 shadow-lg">
                          {selectedService.timesVended}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Recent Movements - Glassmorphism Card */}
                <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                  <div className="relative">
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                          <Clock className="h-4 w-4 text-[var(--unit-accent)]" />
                        </div>
                        <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">
                          Movimientos Recientes
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
                                    <Clock className="h-4 w-4 text-[var(--unit-text-muted)]" />
                                    <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-2 py-1 rounded-lg border border-[var(--unit-border)]/30">
                                      {movement.isDirectSale ? 'Venta POS' : 'Cita'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-[var(--unit-text-muted)] mb-2">
                                    <span>{movement.createdAt ? format(new Date(movement.createdAt), 'dd/MM/yyyy HH:mm') : 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-[var(--unit-text-muted)]">
                                    <span>Cliente: {movement.appointment?.customer?.name || 'No especificado'}</span>
                                    {movement.isDirectSale && movement.sale && (
                                      <span>Venta: #{movement.sale.saleNumber}</span>
                                    )}
                                  </div>
                                  {movement.appointment?.status && (
                                    <div className="flex items-center gap-2 text-xs text-[var(--unit-text-muted)] mt-1">
                                      <span>Estado: {movement.appointment.status}</span>
                                      {movement.appointment?.notes && <span>• {movement.appointment.notes}</span>}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  {movement.discountAmount && movement.discountAmount > 0 ? (
                                    <div className="space-y-1">
                                      <div className="text-xs text-[var(--unit-text-muted)] line-through">
                                        S/ {Number(movement.price || 0).toFixed(2)}
                                      </div>
                                      <div className="text-xs text-red-600">
                                        -S/ {Number(movement.discountAmount).toFixed(2)}
                                        {movement.discountReason && (
                                          <span className="text-xs text-[var(--unit-text-muted)] block">
                                            ({movement.discountReason})
                                          </span>
                                        )}
                                      </div>
                                      <div className="font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                                        S/ {Number(movement.finalPrice || 0).toFixed(2)}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                                      S/ {Number(movement.price || 0).toFixed(2)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Footer Actions */}
              <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-t border-[var(--unit-border)]/30 -mx-8 -mb-8 mt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                      <Eye className="h-4 w-4 text-[var(--unit-accent)]" />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--unit-text-muted)]">Resumen del Servicio</p>
                      <p className="text-sm font-bold text-[var(--unit-text)]">
                        {selectedService.name} • S/ {selectedService.price.toFixed(2)} • {selectedService.durationMin} min
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
