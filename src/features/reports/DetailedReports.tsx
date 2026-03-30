'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, getAccessToken } from '@/lib/api';
import { DataTable } from '@/components/ui/DataTable';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { DetailedReportsMetrics } from './DetailedReportsMetrics';
import { Search, Filter, Download, Eye, Edit, DollarSign, User, Calendar, Building2, Package, Receipt, FileText, Users, Trash2, AlertCircle, ChevronDown, ChevronUp, BarChart3, TrendingUp, Clock, CheckCircle2, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { startOfDay, endOfDay, subDays } from 'date-fns';

// Types for unified data structure
interface UnifiedReportData {
  id: string;
  type: 'sale' | 'appointment' | 'client' | 'product' | 'commission' | 'cash-register';
  referenceId: string;
  title: string;
  subtitle?: string;
  amount?: number;
  status?: string;
  date: string;
  unit: 'SPA' | 'BARBERIA';
  customer?: string;
  employee?: string;
  details?: Record<string, any>;
}

interface DetailedReportsProps {
  unit: string;
  dateFrom: Date;
  dateTo: Date;
}

export function DetailedReports({ unit, dateFrom, dateTo }: DetailedReportsProps): JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Debounce hook para búsqueda
  function useDebouncedValue<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
      const t = setTimeout(() => setDebounced(value), delay);
      return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
  }
  
  const debouncedSearchTerm = useDebouncedValue(searchTerm.trim(), 300);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentUnit, setCurrentUnit] = useState(unit);
  const [currentDateFrom, setCurrentDateFrom] = useState(dateFrom);
  const [currentDateTo, setCurrentDateTo] = useState(dateTo);
  const { success, error } = useToast();
  const [showFilters, setShowFilters] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // ✅ MEJORADO: Sync props with local state
  useEffect(() => {
    setCurrentUnit(unit);
    setCurrentDateFrom(dateFrom);
    setCurrentDateTo(dateTo);
    setPage(1); // Reset page when filters change
  }, [unit, dateFrom, dateTo]);

  // ✅ MEJORADO: Single unified query to new backend
  const { data: detailedData, isLoading } = useQuery({
    queryKey: ['detailed-reports', currentUnit, currentDateFrom, currentDateTo, page, limit, selectedType, selectedStatus, debouncedSearchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        unit: currentUnit || '',
        from: currentDateFrom.toISOString(),
        to: currentDateTo.toISOString(),
        page: page.toString(),
        limit: limit.toString(),
        ...(selectedType && { type: selectedType }),
        ...(selectedStatus && { status: selectedStatus }),
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
      });
      
      const { data } = await api.get(`/api/reports/detailed?${params}`);
      return data;
    },
  });

  // ✅ MEJORADO: Use data directly from backend (already filtered)
  const data = detailedData?.data || [];
  const pagination = detailedData?.pagination;

  // Helper functions
  const getTypeIcon = (type: string) => {
    const iconMap = {
      sale: <Receipt className="h-4 w-4 text-[var(--unit-text-muted)]" />,
      appointment: <Calendar className="h-4 w-4 text-[var(--unit-text-muted)]" />,
      client: <Users className="h-4 w-4 text-[var(--unit-text-muted)]" />,
      product: <Package className="h-4 w-4 text-[var(--unit-text-muted)]" />,
      commission: <DollarSign className="h-4 w-4 text-[var(--unit-text-muted)]" />,
      'cash-register': <FileText className="h-4 w-4 text-[var(--unit-text-muted)]" />,
    };
    return iconMap[type as keyof typeof iconMap] || <FileText className="h-4 w-4 text-[var(--unit-text-muted)]" />;
  };

  const getStatusLabel = (status: string) => {
    const labelMap = {
      CLOSED: 'Cerrado',
      OPEN: 'Abierto',
      PENDING: 'Pendiente',
      PAID: 'Pagado',
      CANCELLED: 'Cancelado',
      COMPLETED: 'Completado',
      SCHEDULED: 'Programado',
    };
    return labelMap[status as keyof typeof labelMap] || status;
  };

  const columns = [
    {
      key: 'title',
      header: 'Descripción',
      sortable: true,
      render: (row: UnifiedReportData) => (
        <div>
          <div className="flex items-center gap-2">
            {getTypeIcon(row.type)}
            <span className="font-medium text-[var(--unit-text-muted)]">{row.title}</span>
          </div>
          {row.subtitle && (
            <div className="text-sm text-[var(--unit-text-muted)] mt-1">{row.subtitle}</div>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (row: UnifiedReportData) => {
        const typeConfig = {
          sale: { label: 'Venta', color: 'bg-green-100 text-green-800' },
          appointment: { label: 'Cita', color: 'bg-blue-100 text-blue-800' },
          client: { label: 'Cliente', color: 'bg-purple-100 text-purple-800' },
          product: { label: 'Producto', color: 'bg-amber-100 text-amber-800' },
          commission: { label: 'Comisión', color: 'bg-pink-100 text-pink-800' },
          'cash-register': { label: 'Caja', color: 'bg-indigo-100 text-indigo-800' },
        };
        const config = typeConfig[row.type];
        return (
          <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', config.color)}>
            {config.label}
          </span>
        );
      },
    },
    {
      key: 'amount',
      header: 'Monto',
      sortable: true,
      render: (row: UnifiedReportData) => (
        row.amount ? (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 font-bold">
            S/ {row.amount.toFixed(2)}
          </span>
        ) : (
          <span className="text-[var(--unit-text-muted)]">—</span>
        )
      ),
    },
    {
      key: 'customer',
      header: 'Cliente',
      render: (row: UnifiedReportData) => (
        row.customer ? (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-pink-100 text-pink-800">
            {row.customer}
          </span>
        ) : (
          <span className="text-[var(--unit-text-muted)]">—</span>
        )
      ),
    },
    {
      key: 'employee',
      header: 'Empleado',
      render: (row: UnifiedReportData) => (
        row.employee ? (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-pink-100 text-pink-800">
            {row.employee}
          </span>
        ) : (
          <span className="text-[var(--unit-text-muted)]">—</span>
        )
      ),
    },
    {
      key: 'unit',
      header: 'Unidad',
      render: (row: UnifiedReportData) => (
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
      key: 'date',
      header: 'Fecha',
      sortable: true,
      render: (row: UnifiedReportData) => (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800">
          {format(new Date(row.date), 'd MMM yyyy', { locale: es })}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row: UnifiedReportData) => {
        if (!row.status) return <span className="text-[var(--unit-text-muted)]">—</span>;
        const statusConfig: Record<string, string> = {
          CLOSED: 'bg-green-100 text-green-800',
          OPEN: 'bg-blue-100 text-blue-800',
          PENDING: 'bg-yellow-100 text-yellow-800',
          PAID: 'bg-green-100 text-green-800',
          CANCELLED: 'bg-red-100 text-red-800',
          COMPLETED: 'bg-green-100 text-green-800',
          SCHEDULED: 'bg-blue-100 text-blue-800',
        };
        const color = statusConfig[row.status] || 'bg-gray-100 text-gray-800';
        return (
          <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', color)}>
            {getStatusLabel(row.status)}
          </span>
        );
      },
    },
  ];

  const actions = [
    {
      label: 'Ver',
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: UnifiedReportData) => {
        // Navigate to appropriate detail page based on type
        switch (row.type) {
          case 'sale':
            window.open(`/pos/sales/${row.referenceId}`, '_blank');
            break;
          case 'appointment':
            window.open(`/appointments/${row.referenceId}`, '_blank');
            break;
          case 'client':
            window.open(`/clients/${row.referenceId}`, '_blank');
            break;
          case 'commission':
            window.open(`/commissions/admin`, '_blank');
            break;
          case 'cash-register':
            window.open(`/cash/${row.referenceId}`, '_blank');
            break;
          default:
            // TODO: Implement view details for other types
        }
      },
      className: 'text-blue-600 hover:bg-blue-50',
    },
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: (row: UnifiedReportData) => {
        // Navigate to edit page based on type
        switch (row.type) {
          case 'sale':
            window.open(`/pos/sales/${row.referenceId}/edit`, '_blank');
            break;
          case 'appointment':
            window.open(`/appointments/${row.referenceId}/edit`, '_blank');
            break;
          case 'client':
            window.open(`/clients/${row.referenceId}/edit`, '_blank');
            break;
          case 'commission':
            // Commissions can't be edited directly, only recalculated
            error('Las comisiones no se pueden editar directamente. Use "Recalcular" si es necesario.');
            break;
          case 'cash-register':
            window.open(`/cash/${row.referenceId}/edit`, '_blank');
            break;
          default:
            // TODO: Implement edit for other types
        }
      },
      className: 'text-amber-600 hover:bg-amber-50',
      disabled: (row: UnifiedReportData) => {
        // Disable edit for certain types or statuses
        return row.type === 'commission' || row.status === 'COMPLETED' || row.status === 'CANCELLED';
      },
    },
    {
      label: 'Exportar',
      icon: <Download className="h-4 w-4" />,
      onClick: (row: UnifiedReportData) => {
        // Export individual item as PDF
        const data = {
          type: row.type,
          referenceId: row.referenceId,
          title: row.title,
          amount: row.amount,
          date: row.date,
          unit: row.unit,
          customer: row.customer,
          employee: row.employee,
          status: row.status,
        };
        
        // Create simple PDF content (for demo purposes)
        const pdfContent = `
Reporte Individual - ${row.title}
=====================================
Tipo: ${row.type}
ID Referencia: ${row.referenceId}
Título: ${row.title}
Monto: ${row.amount ? `S/ ${row.amount.toFixed(2)}` : 'N/A'}
Fecha: ${format(new Date(row.date), 'dd/MM/yyyy HH:mm')}
Unidad: ${row.unit === 'BARBERIA' ? 'Barbería' : 'SPA'}
Cliente: ${row.customer || 'N/A'}
Empleado: ${row.employee || 'N/A'}
Estado: ${row.status || 'N/A'}
=====================================
Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}
        `;
        
        const blob = new Blob([pdfContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${row.type}_${row.referenceId}_${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      className: 'text-emerald-600 hover:bg-emerald-50',
    },
  ];

  const filters = [
    {
      key: 'type',
      label: 'Tipo',
      type: 'select' as const,
      options: [
        { label: 'Todos', value: '' },
        { label: 'Ventas', value: 'sale' },
        { label: 'Citas', value: 'appointment' },
        { label: 'Clientes', value: 'client' },
        { label: 'Productos', value: 'product' },
        { label: 'Comisiones', value: 'commission' },
        { label: 'Cajas', value: 'cash-register' },
      ],
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'select' as const,
      options: [
        { label: 'Todos', value: '' },
        { label: 'Abierto', value: 'OPEN' },
        { label: 'Cerrado', value: 'CLOSED' },
        { label: 'Pendiente', value: 'PENDING' },
        { label: 'Pagado', value: 'PAID' },
        { label: 'Cancelado', value: 'CANCELLED' },
        { label: 'Completado', value: 'COMPLETED' },
        { label: 'Programado', value: 'SCHEDULED' },
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
  ];

  // ✅ MEJORADO: Add export functionality
  const handleExport = async (format: 'excel' | 'pdf' | 'csv') => {
    try {
      const params = new URLSearchParams({
        unit: currentUnit || '',
        from: currentDateFrom.toISOString(),
        to: currentDateTo.toISOString(),
        format,
      });

      const response = await api.get(`/api/reports/detailed/export?${params}`, {
        responseType: format === 'pdf' ? 'blob' : 'text',
      });

      if (format === 'pdf') {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reportes-detalles-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reportes-detalles-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      success(`Reporte exportado exitosamente en formato ${format.toUpperCase()}`);
    } catch (err) {
      error(err instanceof Error ? err.message : 'Error al exportar reporte');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--unit-surface)] p-6">
      <div className="relative max-w-7xl mx-auto p-6">
        {/* Enhanced Header - Exacto estilo Agenda */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-4">
              <div className="h-2 w-2 rounded-full bg-[var(--unit-accent)] animate-pulse"></div>
              <span className="text-sm font-medium text-[var(--unit-text)]">
                Sistema de Reportes Detallados
              </span>
            </div>
            <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">Reportes Particulares</h1>
            <p className="text-[var(--unit-text-muted)]">
              Búsqueda avanzada unificada de todos los reportes del sistema
            </p>
          </div>

          {/* Detailed Reports Metrics */}
          <DetailedReportsMetrics 
            data={data} 
            filteredData={data} 
            selectedType={selectedType} 
            selectedStatus={selectedStatus} 
            searchTerm={searchTerm} 
            unit={currentUnit} 
            dateFrom={currentDateFrom} 
            dateTo={currentDateTo} 
          />

          {/* Enhanced Action Buttons - Estilo Agenda */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => handleExport('excel')}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg border-2 border-emerald-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="h-5 w-5" />
              Exportar Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold shadow-lg border-2 border-red-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="h-5 w-5" />
              Exportar PDF
            </button>
          </div>
        </div>

        {/* Enhanced Filters Section - Premium Glassmorphism como Agenda */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6 mb-8">
          {/* Filter Header - Exacto estilo Agenda */}
          <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Filtros de Reportes Detallados</h3>
                  <p className="text-sm text-[var(--unit-text-muted)]">Refina tu búsqueda avanzada</p>
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
                dateFrom={currentDateFrom}
                dateTo={currentDateTo}
                onDateFromChange={(date: Date | null) => date && setCurrentDateFrom(date)}
                onDateToChange={(date: Date | null) => date && setCurrentDateTo(date)}
                unit={currentUnit}
                onUnitChange={setCurrentUnit}
                showUnitFilter={true}
                showStatusFilter={false}
                className="rounded-xl"
              />

              {/* Additional Filter Controls - Estilo Agenda */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Type Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Tipo de Registro</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                  >
                    <option value="">Todos los tipos</option>
                    <option value="sale">Ventas</option>
                    <option value="appointment">Citas</option>
                    <option value="client">Clientes</option>
                    <option value="product">Productos</option>
                    <option value="commission">Comisiones</option>
                    <option value="cash-register">Cajas</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Estado</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                  >
                    <option value="">Todos los estados</option>
                    <option value="OPEN">Abierto</option>
                    <option value="CLOSED">Cerrado</option>
                    <option value="PENDING">Pendiente</option>
                    <option value="PAID">Pagado</option>
                    <option value="CANCELLED">Cancelado</option>
                    <option value="COMPLETED">Completado</option>
                    <option value="SCHEDULED">Programado</option>
                  </select>
                </div>

                {/* Search Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Búsqueda</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-[var(--unit-text-muted)]" />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar por título, cliente, empleado..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 pl-12 pr-12 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all placeholder:text-[var(--unit-text-muted)]/50"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
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
              {(selectedType || selectedStatus || searchTerm || currentUnit) && (
                <div className="rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Filtros activos:</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedType && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-200">
                            Tipo: {selectedType === 'sale' ? 'Ventas' : selectedType === 'appointment' ? 'Citas' : selectedType === 'client' ? 'Clientes' : selectedType === 'product' ? 'Productos' : selectedType === 'commission' ? 'Comisiones' : 'Cajas'}
                          </span>
                        )}
                        {selectedStatus && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 border border-purple-200">
                            Estado: {selectedStatus === 'OPEN' ? 'Abierto' : selectedStatus === 'CLOSED' ? 'Cerrado' : selectedStatus === 'PENDING' ? 'Pendiente' : selectedStatus === 'PAID' ? 'Pagado' : selectedStatus === 'CANCELLED' ? 'Cancelado' : selectedStatus === 'COMPLETED' ? 'Completado' : 'Programado'}
                          </span>
                        )}
                        {searchTerm && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                            Búsqueda: {searchTerm}
                          </span>
                        )}
                        {currentUnit && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                            Unidad: {currentUnit === 'SPA' ? 'SPA' : 'Barbería'}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedType('');
                        setSelectedStatus('');
                        setSearchTerm('');
                        setCurrentUnit('');
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
                {/* Enhanced Results Table - Premium Glassmorphism como Agenda */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="h-full w-full bg-repeat" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>
          
          <div className="relative">
            {/* Premium Table Header */}
            <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--unit-text)]">Resultados Detallados</h3>
                    <p className="text-sm text-[var(--unit-text-muted)]">Registros filtrados y unificados</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-[var(--unit-accent)]/20 px-3 py-1.5 text-sm font-bold text-[var(--unit-accent)] border border-[var(--unit-accent)]/30 shadow-sm">
                    {data.length} registros
                  </span>
                </div>
              </div>
            </div>

            {/* Type Summary */}
            <div className="flex items-center gap-2 text-xs text-[var(--unit-text)] mb-4">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                {data.filter((item: UnifiedReportData) => item.type === 'sale').length} ventas
              </span>
              <span className="text-[var(--unit-text-muted)]">•</span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                {data.filter((item: UnifiedReportData) => item.type === 'appointment').length} citas
              </span>
              <span className="text-[var(--unit-text-muted)]">•</span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                {data.filter((item: UnifiedReportData) => item.type === 'client').length} clientes
              </span>
              <span className="text-[var(--unit-text-muted)]">•</span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                {data.filter((item: UnifiedReportData) => ['product', 'commission', 'cash-register'].includes(item.type)).length} otros
              </span>
            </div>
            
            {/* Enhanced DataTable Container */}
            <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-4">
              <DataTable
                columns={columns}
                data={data}
                keyExtractor={(row) => row.id}
                loading={isLoading}
                searchPlaceholder=""
                filters={[]}
                actions={actions}
                emptyMessage="No se encontraron resultados para los filtros seleccionados. Intenta ajustar los filtros o selecciona un período diferente."
                pageSize={limit}
                pageSizeOptions={[10, 20, 50, 100]}
              />
            </div>
          </div>
        </div>

        {/* Period Info - Premium Footer */}
        <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-[var(--unit-text-muted)]">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">Período:</span>
            <span className="text-[var(--unit-text)]">
              {format(currentDateFrom, 'd MMM yyyy', { locale: es })} - {format(currentDateTo, 'd MMM yyyy', { locale: es })}
            </span>
            {currentUnit && (
              <>
                <span className="text-[var(--unit-text-muted)]">•</span>
                <Building2 className="h-4 w-4" />
                <span className="font-medium">Unidad:</span>
                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] border border-[var(--unit-accent)]/20">
                  {currentUnit === 'SPA' ? 'SPA' : 'Barbería'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
