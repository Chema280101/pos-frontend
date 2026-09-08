'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api, getAccessToken } from '@/lib/api';
import { DataTable } from '@/components/ui/DataTable';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { TableToolbar } from '@/components/ui/TableToolbar';
import { TableBadge, getTableBadgeTypeForStatus, getTableBadgeTypeForUnit } from '@/components/ui/TableBadge';
import { Select } from '@/components/ui/Select';
import { DetailedReportsMetrics } from './DetailedReportsMetrics';
import { Search, Filter, Download, Eye, Edit, DollarSign, User, Calendar, Building2, Package, Receipt, FileText, FileSpreadsheet, Users, Trash2, AlertCircle, ChevronDown, ChevronUp, BarChart3, TrendingUp, Clock, CheckCircle2, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { useUnitStore } from '@/store/unitStore';
import { downloadExcelReport } from '@/lib/excelReport';
import { downloadPdfReport } from '@/lib/pdfReport';
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
  const router = useRouter();
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
  const activeUnit = useUnitStore((s) => s.activeUnit);
  const [currentDateFrom, setCurrentDateFrom] = useState(dateFrom);
  const [currentDateTo, setCurrentDateTo] = useState(dateTo);
  const { success, error } = useToast();
  const [showFilters, setShowFilters] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // ✅ MEJORADO: Sync props with local state
  useEffect(() => {
    setCurrentDateFrom(dateFrom);
    setCurrentDateTo(dateTo);
    setPage(1); // Reset page when filters change
  }, [dateFrom, dateTo]);

  // ✅ MEJORADO: Single unified query to new backend
  const { data: detailedData, isLoading } = useQuery({
    queryKey: ['detailed-reports', activeUnit, currentDateFrom, currentDateTo, page, limit, selectedType, selectedStatus, debouncedSearchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        unit: activeUnit || '',
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
        const typeConfig: Record<string, { label: string; type: any }> = {
          sale: { label: 'Venta', type: 'entity-sale' },
          appointment: { label: 'Cita', type: 'date' },
          client: { label: 'Cliente', type: 'entity-user' },
          product: { label: 'Producto', type: 'entity-product' },
          commission: { label: 'Comisión', type: 'entity-commission' },
          'cash-register': { label: 'Caja', type: 'entity-cash-register' },
        };
        const config = typeConfig[row.type] || { label: row.type, type: 'status-default' };
        return (
          <TableBadge type={config.type as any}>
            {config.label}
          </TableBadge>
        );
      },
    },
    {
      key: 'amount',
      header: 'Monto',
      sortable: true,
      render: (row: UnifiedReportData) => (
        row.amount ? (
          <TableBadge type="amount" bold>
            S/ {row.amount.toFixed(2)}
          </TableBadge>
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
          <TableBadge type="customer-name">
            {row.customer}
          </TableBadge>
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
          <TableBadge type="employee-name">
            {row.employee}
          </TableBadge>
        ) : (
          <span className="text-[var(--unit-text-muted)]">—</span>
        )
      ),
    },
    {
      key: 'unit',
      header: 'Unidad',
      render: (row: UnifiedReportData) => (
        <TableBadge type={getTableBadgeTypeForUnit(row.unit)}>
          {row.unit === 'BARBERIA' ? 'Barbería' : 'SPA'}
        </TableBadge>
      ),
    },
    {
      key: 'date',
      header: 'Fecha',
      sortable: true,
      render: (row: UnifiedReportData) => (
        <TableBadge type="date">
          {format(new Date(row.date), 'd MMM yyyy', { locale: es })}
        </TableBadge>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row: UnifiedReportData) => {
        if (!row.status) return <span className="text-[var(--unit-text-muted)]">—</span>;
        return (
          <TableBadge type={getTableBadgeTypeForStatus(row.status)}>
            {getStatusLabel(row.status)}
          </TableBadge>
        );
      },
    },
  ];

  const actions = [
    {
      label: 'Ver',
      variant: 'view' as const,
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: UnifiedReportData) => {
        // Navigate to appropriate detail page based on type
        switch (row.type) {
          case 'sale':
            router.push('/reports/sales');
            break;
          case 'appointment':
            router.push(`/appointments/${row.referenceId}`);
            break;
          case 'client':
            router.push(`/clients/${row.referenceId}`);
            break;
          case 'commission':
            router.push('/commissions/admin');
            break;
          case 'cash-register':
            router.push('/cash-register');
            break;
          case 'product':
            router.push('/inventory');
            break;
          default:
            break;
        }
      },
    },
    {
      label: 'Editar',
      variant: 'edit' as const,
      icon: <Edit className="h-4 w-4" />,
      onClick: (row: UnifiedReportData) => {
        // Navigate to edit page based on type
        switch (row.type) {
          case 'sale':
            router.push('/pos');
            break;
          case 'appointment':
            router.push(`/appointments/${row.referenceId}`);
            break;
          case 'client':
            router.push(`/clients/${row.referenceId}/edit`);
            break;
          case 'commission':
            error('Las comisiones no se pueden editar directamente. Use "Recalcular" en administración.');
            break;
          case 'cash-register':
            router.push('/cash-register');
            break;
          case 'product':
            router.push(`/inventory/products/${row.referenceId}/edit`);
            break;
          default:
            break;
        }
      },
      disabled: (row: UnifiedReportData) => {
        // Disable edit for certain types or statuses
        return row.type === 'commission' || row.status === 'COMPLETED' || row.status === 'CANCELLED';
      },
    },
    {
      label: 'Exportar PDF',
      variant: 'download' as const,
      icon: <Download className="h-4 w-4" />,
      onClick: (row: UnifiedReportData) => {
        const typeLabels: Record<string, string> = {
          sale: 'Venta',
          appointment: 'Cita',
          client: 'Cliente',
          product: 'Producto',
          commission: 'Comisión',
          'cash-register': 'Caja'
        };

        const headers = ['Campo', 'Detalle'];
        const rows = [
          ['Tipo de Registro', typeLabels[row.type] || row.type],
          ['ID / Referencia', row.referenceId || row.id],
          ['Título / Concepto', row.title],
          ['Monto', row.amount ? `S/ ${Number(row.amount).toFixed(2)}` : '—'],
          ['Fecha', format(new Date(row.date), 'dd/MM/yyyy HH:mm', { locale: es })],
          ['Unidad', row.unit === 'BARBERIA' ? 'Barbería' : 'SPA'],
          ['Cliente', row.customer || '—'],
          ['Especialista / Empleado', row.employee || '—'],
          ['Estado', row.status || '—'],
        ];

        downloadPdfReport(
          `reporte-individual-${row.type}-${row.referenceId || row.id}-${new Date().toISOString().slice(0, 10)}.pdf`,
          `REPORTE INDIVIDUAL - ${row.title.toUpperCase()}`,
          row.unit === 'BARBERIA' ? 'Barbería' : 'SPA',
          headers,
          rows,
          {
            unit: row.unit,
            filterInfo: `Tipo: ${typeLabels[row.type] || row.type} | ID: ${row.referenceId || row.id}`
          }
        );
        success('Reporte individual PDF descargado');
      },
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

  // ✅ MEJORADO: Exportación ejecutiva real de Reportes Particulares
  const handleExport = async (formatType: 'excel' | 'pdf') => {
    try {
      const params = new URLSearchParams({
        ...(activeUnit && { unit: activeUnit }),
        from: currentDateFrom.toISOString(),
        to: currentDateTo.toISOString(),
        page: '1',
        limit: '5000',
        ...(selectedType && { type: selectedType }),
        ...(selectedStatus && { status: selectedStatus }),
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
      });

      const response = await api.get(`/api/reports/detailed?${params}`);
      const rawRows: UnifiedReportData[] = response.data?.data || data || [];

      if (!rawRows || rawRows.length === 0) {
        error('No hay datos disponibles para exportar con los filtros seleccionados');
        return;
      }

      const typeLabels: Record<string, string> = {
        sale: 'Venta',
        appointment: 'Cita',
        client: 'Cliente',
        product: 'Producto',
        commission: 'Comisión',
        'cash-register': 'Caja'
      };

      const headers = ['Tipo', 'Referencia', 'Título / Concepto', 'Fecha', 'Unidad', 'Cliente', 'Empleado', 'Estado', 'Monto (S/)'];
      const rows = rawRows.map((r) => [
        typeLabels[r.type] || r.type,
        r.referenceId || r.id,
        r.title || '—',
        r.date ? format(new Date(r.date), 'dd/MM/yyyy HH:mm', { locale: es }) : '—',
        r.unit === 'BARBERIA' ? 'Barbería' : 'SPA',
        r.customer || '—',
        r.employee || '—',
        r.status || '—',
        r.amount ? Number(r.amount).toFixed(2) : '—'
      ]);

      const totalAmount = rawRows.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      const filename = `reportes-particulares-${activeUnit || 'general'}-${new Date().toISOString().slice(0, 10)}`;

      if (formatType === 'excel') {
        await downloadExcelReport(
          `${filename}.xlsx`,
          'Reportes Particulares',
          headers,
          rows,
          {
            unit: activeUnit || 'General',
            reportTitle: 'REPORTE DETALLADO UNIFICADO',
            periodInfo: { from: currentDateFrom, to: currentDateTo },
            totalAmount: totalAmount > 0 ? totalAmount : undefined,
            filterInfo: [
              activeUnit ? `Unidad: ${activeUnit}` : null,
              selectedType ? `Tipo: ${typeLabels[selectedType] || selectedType}` : null,
              selectedStatus ? `Estado: ${selectedStatus}` : null
            ].filter(Boolean).join(' | ') || undefined
          }
        );
      } else {
        downloadPdfReport(
          `${filename}.pdf`,
          'REPORTE DETALLADO UNIFICADO',
          activeUnit ? (activeUnit === 'BARBERIA' ? 'Barbería' : 'SPA') : 'Todas las unidades',
          headers,
          rows,
          {
            unit: activeUnit || 'General',
            periodInfo: { from: currentDateFrom, to: currentDateTo },
            totals: totalAmount > 0 ? {
              label: 'MONTO TOTAL REGISTRADO:',
              amount: totalAmount,
              currency: 'S/'
            } : undefined,
            filterInfo: [
              activeUnit ? `Unidad: ${activeUnit}` : null,
              selectedType ? `Tipo: ${typeLabels[selectedType] || selectedType}` : null,
              selectedStatus ? `Estado: ${selectedStatus}` : null
            ].filter(Boolean).join(' | ') || undefined
          }
        );
      }

      success(`Reporte ${formatType.toUpperCase()} descargado exitosamente`);
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
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-[var(--unit-surface-elevated)]/20 backdrop-blur-sm rounded-full border border-white/30 mb-4">
              <div className="h-2 w-2 rounded-full bg-[var(--unit-accent)] animate-pulse"></div>
              <span className="text-sm font-medium text-[var(--unit-text)]">
                Sistema de Reportes Detallados
              </span>
            </div>
            <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-unit">Reportes Particulares</h1>
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
            unit={activeUnit || ''} 
            dateFrom={currentDateFrom} 
            dateTo={currentDateTo} 
          />

          {/* Normalized Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={() => handleExport('excel')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-xs font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-all shadow-unit-sm"
              title="Exportar a Excel"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>Exportar Excel</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-xs font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-all shadow-unit-sm"
              title="Exportar a PDF"
            >
              <FileText className="h-4 w-4 text-rose-600" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>

        {/* Unified TableToolbar Filters */}
        <TableToolbar
          search={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Buscar por título, cliente, empleado..."
          chips={[
            { id: '', label: 'Todos los tipos', count: data.length },
            { id: 'sale', label: 'Ventas', count: data.filter((d: UnifiedReportData) => d.type === 'sale').length },
            { id: 'appointment', label: 'Citas', count: data.filter((d: UnifiedReportData) => d.type === 'appointment').length },
            { id: 'client', label: 'Clientes', count: data.filter((d: UnifiedReportData) => d.type === 'client').length },
          ]}
          activeChip={selectedType}
          onChipChange={(id) => setSelectedType(String(id))}
          showAdvancedFiltersButton={true}
          isAdvancedOpen={showFilters}
          onToggleAdvanced={() => setShowFilters(!showFilters)}
          activeFiltersCount={(selectedType ? 1 : 0) + (selectedStatus ? 1 : 0) + (searchTerm ? 1 : 0)}
          onResetFilters={() => {
            setSelectedType('');
            setSelectedStatus('');
            setSearchTerm('');
            setCurrentDateFrom(startOfDay(subDays(new Date(), 30)));
            setCurrentDateTo(endOfDay(new Date()));
          }}
          advancedFiltersContent={
            <div className="space-y-6">
              <DateRangeFilter
                dateFrom={currentDateFrom}
                dateTo={currentDateTo}
                onDateFromChange={(date: Date | null) => date && setCurrentDateFrom(date)}
                onDateToChange={(date: Date | null) => date && setCurrentDateTo(date)}
                showUnitFilter={false}
                showStatusFilter={false}
                className="rounded-unit"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Select
                    label="Tipo de Registro"
                    options={[
                      { value: '', label: 'Todos los tipos' },
                      { value: 'sale', label: 'Ventas' },
                      { value: 'appointment', label: 'Citas' },
                      { value: 'client', label: 'Clientes' },
                      { value: 'product', label: 'Productos' },
                      { value: 'commission', label: 'Comisiones' },
                      { value: 'cash-register', label: 'Cajas' },
                    ]}
                    value={selectedType}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedType(e.target.value)}
                  />
                </div>
                <div>
                  <Select
                    label="Estado"
                    options={[
                      { value: '', label: 'Todos los estados' },
                      { value: 'OPEN', label: 'Abierto' },
                      { value: 'CLOSED', label: 'Cerrado' },
                      { value: 'PENDING', label: 'Pendiente' },
                      { value: 'PAID', label: 'Pagado' },
                      { value: 'CANCELLED', label: 'Cancelado' },
                      { value: 'COMPLETED', label: 'Completado' },
                      { value: 'SCHEDULED', label: 'Programado' },
                    ]}
                    value={selectedStatus}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedStatus(e.target.value)}
                  />
                </div>
              </div>
            </div>
          }
        />

        {/* Enhanced Results Table - Premium Glassmorphism como Agenda */}
        <div className="relative overflow-hidden rounded-unit-lg border border-[var(--unit-border)]/60 bg-[var(--unit-surface)] shadow-unit-lg p-6">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="h-full w-full bg-repeat" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>
          
          <div className="relative">
            {/* Premium Table Header */}
            <div className="bg-[var(--unit-surface-elevated)] px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-unit bg-[var(--unit-accent)] text-white shadow-unit">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--unit-text)]">Resultados Detallados</h3>
                    <p className="text-sm text-[var(--unit-text-muted)]">Registros filtrados y unificados</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-[var(--unit-accent)]/15 px-3 py-1.5 text-sm font-bold text-[var(--unit-accent)] border border-[var(--unit-accent)]/30 shadow-unit-sm">
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
            <div className="relative overflow-hidden rounded-unit border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-4">
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
        <div className="relative overflow-hidden rounded-unit border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-[var(--unit-text-muted)]">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">Período:</span>
            <span className="text-[var(--unit-text)]">
              {format(currentDateFrom, 'd MMM yyyy', { locale: es })} - {format(currentDateTo, 'd MMM yyyy', { locale: es })}
            </span>
            {activeUnit && (
              <>
                <span className="text-[var(--unit-text-muted)]">•</span>
                <Building2 className="h-4 w-4" />
                <span className="font-medium">Unidad:</span>
                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] border border-[var(--unit-accent)]/20">
                  {activeUnit === 'SPA' ? 'SPA' : 'Barbería'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
