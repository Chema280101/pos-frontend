'use client';

import { useState, useMemo, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { TableToolbar } from '@/components/ui/TableToolbar';
import { TableBadge } from '@/components/ui/TableBadge';
import { ReportOverview } from './ReportOverview';
import { ReportsMetrics } from './ReportsMetrics';
import { useUnitStore } from '@/store/unitStore';
import { Download, Filter, ChevronDown, ChevronUp, BarChart3, DollarSign, Calendar, Users, Package, TrendingUp, Building2, CheckCircle, AlertCircle, X, FileSpreadsheet, FileText } from 'lucide-react';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';
import { api } from '@/lib/api';
import { downloadExcelReport } from '@/lib/excelReport';
import { downloadPdfReport } from '@/lib/pdfReport';

type BusinessUnit = 'SPA' | 'BARBERIA' | '';

// Lazy loading para componentes pesados
const SalesReport = dynamic(() => import('./SalesReport').then(mod => ({ default: mod.SalesReport })), {
  loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-unit-lg" />,
  ssr: false
});

const AppointmentsReport = dynamic(() => import('./AppointmentsReport').then(mod => ({ default: mod.AppointmentsReport })), {
  loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-unit-lg" />,
  ssr: false
});

const ClientsReport = dynamic(() => import('./ClientsReport').then(mod => ({ default: mod.ClientsReport })), {
  loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-unit-lg" />,
  ssr: false
});

const InventoryReport = dynamic(() => import('./InventoryReport').then(mod => ({ default: mod.InventoryReport })), {
  loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-unit-lg" />,
  ssr: false
});

const CommissionsReport = dynamic(() => import('./CommissionsReport').then(mod => ({ default: mod.CommissionsReport })), {
  loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-unit-lg" />,
  ssr: false
});

const CashRegisterReport = dynamic(() => import('./CashRegisterReport').then(mod => ({ default: mod.CashRegisterReport })), {
  loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-unit-lg" />,
  ssr: false
});

export function ReportsPage(): JSX.Element {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  
  // Auto-detect report type from URL
  const detectedReportType = useMemo(() => {
    const currentPath = pathname || '';
    if (currentPath.includes('/sales')) return 'sales';
    if (currentPath.includes('/appointments')) return 'appointments';
    if (currentPath.includes('/clients')) return 'clients';
    if (currentPath.includes('/inventory')) return 'inventory';
    if (currentPath.includes('/commissions')) return 'commissions';
    if (currentPath.includes('/cash')) return 'cash-register';
    return 'overview'; // Default for main /reports page
  }, [pathname]);

  const activeUnit = useUnitStore((s) => s.activeUnit);
  const setUnit = useUnitStore((s) => s.setUnit);
  const [dateFrom, setDateFrom] = useState(() => startOfDay(subDays(new Date(), 30)));
  const [dateTo, setDateTo] = useState(() => endOfDay(new Date()));
  const [showFilters, setShowFilters] = useState(true);
  
  // ✅ ELIMINADO: Estados no utilizados
  // const [reportTypeFilter, setReportTypeFilter] = useState<string>(''); // ❌ No usado
  // const [searchFilter, setSearchFilter] = useState<string>(''); // ❌ No usado
  
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Auto-dismiss notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Export mutations
  const exportExcelMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams({
        from: dateFrom.toISOString(),
        to: dateTo.toISOString(),
        format: 'csv'
      });
      if (activeUnit) params.set('unit', activeUnit);

      let endpoint = '';
      let headers: string[] = [];

      switch (detectedReportType) {
        case 'sales':
          endpoint = '/api/reports/sales/export';
          headers = ['id', 'saleNumber', 'unit', 'total', 'paymentMethod', 'closedAt', 'customerName', 'employeeName'];
          break;
        case 'appointments':
          endpoint = '/api/reports/appointments/export';
          headers = ['id', 'startTime', 'endTime', 'status', 'unit', 'customer', 'createdBy'];
          break;
        case 'clients':
          endpoint = '/api/reports/clients/export';
          headers = ['id', 'name', 'phone', 'email', 'howFoundUs', 'createdAt'];
          break;
        case 'inventory':
          endpoint = '/api/reports/inventory/export';
          headers = ['id', 'name', 'type', 'unit', 'category', 'stock', 'minStock', 'salePrice'];
          break;
        case 'commissions':
          endpoint = '/api/reports/commissions/export';
          headers = ['id', 'user', 'amount', 'status', 'createdAt', 'sale'];
          break;
        case 'cash-register':
          endpoint = '/api/reports/cash-register/export';
          headers = ['id', 'date', 'unit', 'openingAmount', 'closingAmount', 'status', 'employee'];
          break;
        default:
          endpoint = '/api/reports/sales/export';
          headers = ['id', 'saleNumber', 'unit', 'total', 'paymentMethod', 'closedAt', 'customerName', 'employeeName'];
      }

      const response = await api.get(`${endpoint}?${params}`);
      let realData: any[] = [];
      let csvHeaders: string[] = [];
      
      if (typeof response.data === 'string') {
        const lines = response.data.split('\n').filter((line: string) => line.trim());
        csvHeaders = lines[0]?.split(',').map((h: string) => h.replace(/"/g, '').trim()) || [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map((v: string) => v.replace(/"/g, '').trim());
          const row: Record<string, string> = {};
          csvHeaders.forEach((header: string, index: number) => {
            row[header] = values[index] || '';
          });
          realData.push(row);
        }
      } else if (Array.isArray(response.data)) {
        realData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        realData = response.data.data;
      } else {
        realData = [];
      }

      const finalHeaders = csvHeaders.length > 0 ? csvHeaders : headers;
      
      const headerLabels: Record<string, string> = {
        'id': 'ID',
        'saleNumber': 'N° Venta',
        'unit': 'Unidad',
        'total': 'Total (S/)',
        'paymentMethod': 'Método de Pago',
        'closedAt': 'Fecha Cierre',
        'createdAt': 'Fecha Creación',
        'customer': 'Cliente',
        'customerName': 'Cliente',
        'createdBy': 'Empleado',
        'employeeName': 'Empleado',
        'userName': 'Empleado',
        'startTime': 'Hora Inicio',
        'endTime': 'Hora Fin',
        'status': 'Estado',
        'name': 'Nombre',
        'phone': 'Teléfono',
        'email': 'Email',
        'howFoundUs': 'Origen',
        'type': 'Tipo',
        'category': 'Categoría',
        'stock': 'Stock',
        'minStock': 'Stock Mínimo',
        'salePrice': 'Precio Venta (S/)',
        'costPrice': 'Precio Costo (S/)',
        'user': 'Empleado',
        'amount': 'Monto (S/)',
        'pctApplied': '% Comisión',
        'sale': 'Venta',
        'date': 'Fecha',
        'openingAmount': 'Monto Apertura',
        'closingAmount': 'Monto Cierre',
        'closingDeclared': 'Monto Declarado',
        'closingExpected': 'Monto Esperado',
        'difference': 'Diferencia',
        'openedAt': 'Fecha Apertura',
        'employee': 'Empleado'
      };
      
      const readableHeaders = finalHeaders.map(h => headerLabels[h] || h);
      const rowsData = realData.map((row: any) => finalHeaders.map(header => {
        const val = row[header];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') {
          return val.name || val.label || val.id || JSON.stringify(val);
        }
        return val;
      }));

      const reportTitle = detectedReportType === 'overview' ? 'REPORTE GENERAL DE VENTAS' :
                         detectedReportType === 'sales' ? 'REPORTE DE VENTAS' :
                         detectedReportType === 'appointments' ? 'REPORTE DE CITAS' :
                         detectedReportType === 'clients' ? 'REPORTE DE CLIENTES' :
                         detectedReportType === 'inventory' ? 'REPORTE DE INVENTARIO' :
                         detectedReportType === 'commissions' ? 'REPORTE DE COMISIONES' :
                         'REPORTE DE CAJA';

      await downloadExcelReport(
        `reporte-${detectedReportType}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
        reportTitle,
        readableHeaders,
        rowsData,
        {
          unit: activeUnit || 'General',
          reportTitle,
          periodInfo: { from: dateFrom, to: dateTo },
          filterInfo: activeUnit ? `Unidad: ${activeUnit}` : undefined
        }
      );

      setNotification({type: 'success', message: `Reporte Excel descargado con ${realData.length} registros`});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports-metrics'] });
    },
    onError: (error: any) => {
      setNotification({type: 'error', message: 'Error al exportar reporte Excel'});
    }
  });

  const exportPDFMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams({
        from: dateFrom.toISOString(),
        to: dateTo.toISOString(),
        format: 'csv'
      });
      if (activeUnit) params.set('unit', activeUnit);

      let endpoint = '';
      let headers: string[] = [];

      switch (detectedReportType) {
        case 'sales':
          endpoint = '/api/reports/sales/export';
          headers = ['id', 'saleNumber', 'unit', 'total', 'paymentMethod', 'closedAt', 'customerName', 'employeeName'];
          break;
        case 'appointments':
          endpoint = '/api/reports/appointments/export';
          headers = ['id', 'startTime', 'endTime', 'status', 'unit', 'customer', 'createdBy'];
          break;
        case 'clients':
          endpoint = '/api/reports/clients/export';
          headers = ['id', 'name', 'phone', 'email', 'howFoundUs', 'createdAt'];
          break;
        case 'inventory':
          endpoint = '/api/reports/inventory/export';
          headers = ['id', 'name', 'type', 'unit', 'category', 'stock', 'minStock', 'salePrice'];
          break;
        case 'commissions':
          endpoint = '/api/reports/commissions/export';
          headers = ['id', 'user', 'amount', 'status', 'createdAt', 'sale'];
          break;
        case 'cash-register':
          endpoint = '/api/reports/cash-register/export';
          headers = ['id', 'date', 'unit', 'openingAmount', 'closingAmount', 'status', 'employee'];
          break;
        default:
          endpoint = '/api/reports/sales/export';
          headers = ['id', 'saleNumber', 'unit', 'total', 'paymentMethod', 'closedAt', 'customerName', 'employeeName'];
      }

      const response = await api.get(`${endpoint}?${params}`);
      let realData: any[] = [];
      let csvHeaders: string[] = [];

      if (typeof response.data === 'string') {
        const lines = response.data.split('\n').filter((line: string) => line.trim());
        csvHeaders = lines[0]?.split(',').map((h: string) => h.replace(/"/g, '').trim()) || [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map((v: string) => v.replace(/"/g, '').trim());
          const row: Record<string, string> = {};
          csvHeaders.forEach((header: string, index: number) => {
            row[header] = values[index] || '';
          });
          realData.push(row);
        }
      } else if (Array.isArray(response.data)) {
        realData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        realData = response.data.data;
      } else {
        realData = [];
      }

      const finalHeaders = csvHeaders.length > 0 ? csvHeaders : headers;
      const headerLabels: Record<string, string> = {
        'id': 'ID',
        'saleNumber': 'N° Venta',
        'unit': 'Unidad',
        'total': 'Total (S/)',
        'paymentMethod': 'Método Pago',
        'closedAt': 'Fecha Cierre',
        'createdAt': 'Fecha Creación',
        'customer': 'Cliente',
        'customerName': 'Cliente',
        'createdBy': 'Empleado',
        'employeeName': 'Empleado',
        'userName': 'Empleado',
        'startTime': 'Hora Inicio',
        'endTime': 'Hora Fin',
        'status': 'Estado',
        'name': 'Nombre',
        'phone': 'Teléfono',
        'email': 'Email',
        'howFoundUs': 'Origen',
        'type': 'Tipo',
        'category': 'Categoría',
        'stock': 'Stock',
        'minStock': 'Stock Mín.',
        'salePrice': 'Precio Venta (S/)',
        'costPrice': 'Precio Costo (S/)',
        'user': 'Empleado',
        'amount': 'Monto (S/)',
        'pctApplied': '% Com.',
        'sale': 'Venta',
        'date': 'Fecha',
        'openingAmount': 'Monto Apertura',
        'closingAmount': 'Monto Cierre',
        'closingDeclared': 'Monto Declarado',
        'closingExpected': 'Monto Esperado',
        'difference': 'Diferencia',
        'openedAt': 'Fecha Apertura',
        'employee': 'Empleado'
      };

      const readableHeaders = finalHeaders.map(h => headerLabels[h] || h);
      const rowsData = realData.map((row: any) => finalHeaders.map(header => {
        const val = row[header];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') {
          return val.name || val.label || val.id || JSON.stringify(val);
        }
        return val;
      }));

      const reportTitle = detectedReportType === 'overview' ? 'REPORTE GENERAL DE VENTAS' :
                         detectedReportType === 'sales' ? 'REPORTE DE VENTAS' :
                         detectedReportType === 'appointments' ? 'REPORTE DE CITAS' :
                         detectedReportType === 'clients' ? 'REPORTE DE CLIENTES' :
                         detectedReportType === 'inventory' ? 'REPORTE DE INVENTARIO' :
                         detectedReportType === 'commissions' ? 'REPORTE DE COMISIONES' :
                         'REPORTE DE CAJA';

      downloadPdfReport(
        `reporte_${detectedReportType}_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
        reportTitle,
        activeUnit || 'Todas las unidades',
        readableHeaders,
        rowsData,
        {
          unit: activeUnit || 'General',
          periodInfo: { from: dateFrom, to: dateTo },
          filterInfo: activeUnit ? `Unidad: ${activeUnit}` : undefined
        }
      );

      setNotification({type: 'success', message: `Reporte PDF descargado con ${realData.length} registros`});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports-metrics'] });
    },
    onError: (error: any) => {
      setNotification({type: 'error', message: 'Error al exportar reporte PDF'});
    }
  });

  return (
    <div className="min-h-screen bg-[var(--unit-surface)]">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Top Header & Fast Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--unit-border)]/40 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] text-xs font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--unit-accent)] animate-pulse" />
                Inteligencia de Negocio • {activeUnit === 'BARBERIA' ? 'Barbería' : 'SPA'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--unit-text)] tracking-tight">
              Reportes & Analítica Operativa
            </h1>
            <p className="text-xs sm:text-sm text-[var(--unit-text-muted)]">
              {detectedReportType === 'overview' 
                ? 'Resumen integral de rendimiento comercial, financiero y operativo'
                : `Métricas y análisis detallado de ${detectedReportType === 'sales' ? 'ventas' : 
                             detectedReportType === 'appointments' ? 'citas y agendamiento' : 
                             detectedReportType === 'clients' ? 'cartera de clientes' : 
                             detectedReportType === 'inventory' ? 'rotación de inventario' : 
                             detectedReportType === 'commissions' ? 'comisiones de especialistas' : 'flujo de caja'}`
              }
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['reports-metrics'] })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-xs font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-all shadow-unit-sm"
              title="Actualizar datos"
            >
              <BarChart3 className="h-4 w-4 text-[var(--unit-accent)]" />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            <button
              onClick={() => exportExcelMutation.mutate()}
              disabled={exportExcelMutation.isPending || exportPDFMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-xs font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-all shadow-unit-sm disabled:opacity-50"
              title="Exportar a Excel"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>{exportExcelMutation.isPending ? 'Generando...' : 'Exportar Excel'}</span>
            </button>

            <button
              onClick={() => exportPDFMutation.mutate()}
              disabled={exportExcelMutation.isPending || exportPDFMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-xs font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-all shadow-unit-sm disabled:opacity-50"
              title="Exportar a PDF"
            >
              <FileText className="h-4 w-4 text-rose-600" />
              <span>{exportPDFMutation.isPending ? 'Generando...' : 'Exportar PDF'}</span>
            </button>
          </div>
        </div>

        {/* Reports Metrics */}
        <ReportsMetrics 
          reportType={detectedReportType} 
          dateFrom={dateFrom} 
          dateTo={dateTo} 
          unit={activeUnit || ''} 
        />

        {/* Enhanced Reports Filters using TableToolbar */}
        <div className="mb-8">
          <TableToolbar
            showSearch={false}
            showAdvancedFiltersButton={true}
            isAdvancedOpen={showFilters}
            onToggleAdvanced={() => setShowFilters(!showFilters)}
            activeFiltersCount={activeUnit ? 1 : 0}
            onResetFilters={() => {
              setUnit(null);
              setDateFrom(startOfDay(subDays(new Date(), 30)));
              setDateTo(endOfDay(new Date()));
            }}
            advancedFiltersContent={
              <div className="space-y-4">
                <DateRangeFilter
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                  onDateFromChange={(date: Date | null) => date && setDateFrom(date)}
                  onDateToChange={(date: Date | null) => date && setDateTo(date)}
                  showUnitFilter={false}
                  showStatusFilter={false}
                  className="rounded-unit"
                />
                {activeUnit && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--unit-border)]/30">
                    <span className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Filtros activos:</span>
                    <TableBadge type={activeUnit === 'SPA' ? 'unit-spa' : 'unit-barberia'}>
                      Unidad: {activeUnit === 'SPA' ? 'SPA' : 'Barbería'}
                    </TableBadge>
                  </div>
                )}
              </div>
            }
          />
        </div>

        {/* Enhanced Reports Table - Premium Glassmorphism */}
        <div className="relative overflow-hidden rounded-unit-lg border border-[var(--unit-border)]/60 bg-[var(--unit-surface)] shadow-unit-lg p-8">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="h-full w-full bg-repeat" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>
          
          <div className="relative">
            {/* Premium Table Header */}
            <div className="bg-[var(--unit-surface-elevated)] px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-8 -mt-8 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-unit bg-[var(--unit-accent)] text-white shadow-unit">
                    <Download className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--unit-text)]">Lista de Reportes</h3>
                    <p className="text-sm text-[var(--unit-text-muted)]">Visualización de datos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-[var(--unit-accent)]/15 px-3 py-1.5 text-sm font-bold text-[var(--unit-accent)] border border-[var(--unit-accent)]/30 shadow-unit-sm">
                    {detectedReportType === 'overview' ? 'Resumen General' : `Reporte de ${detectedReportType === 'sales' ? 'Ventas' : 
                               detectedReportType === 'appointments' ? 'Citas' : 
                               detectedReportType === 'clients' ? 'Clientes' : 
                               detectedReportType === 'inventory' ? 'Inventario' : 
                               detectedReportType === 'commissions' ? 'Comisiones' : 'Cajas'}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Report Content - Enhanced Container */}
            <div className="relative overflow-hidden rounded-unit border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6">
              {/* Report Type Indicator */}
              <div className="flex items-center gap-2 mb-4">
                <div className={`h-2 w-2 rounded-full animate-pulse ${
                  detectedReportType === 'overview' ? 'bg-[var(--unit-accent)]' :
                  detectedReportType === 'sales' ? 'bg-emerald-500' :
                  detectedReportType === 'appointments' ? 'bg-blue-500' :
                  detectedReportType === 'clients' ? 'bg-purple-500' :
                  detectedReportType === 'inventory' ? 'bg-amber-500' :
                  detectedReportType === 'commissions' ? 'bg-indigo-500' :
                  'bg-red-500'
                }`}></div>
                <span className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">
                  {detectedReportType === 'overview' ? 'Resumen General' : 
                   detectedReportType === 'sales' ? 'Reporte de Ventas' : 
                   detectedReportType === 'appointments' ? 'Reporte de Citas' : 
                   detectedReportType === 'clients' ? 'Reporte de Clientes' : 
                   detectedReportType === 'inventory' ? 'Reporte de Inventario' : 
                   detectedReportType === 'commissions' ? 'Reporte de Comisiones' : 
                   'Reporte de Cajas'}
                </span>
              </div>

              {/* Dynamic Report Content */}
              {detectedReportType === 'overview' && (
                <div className="space-y-4">
                  <ReportOverview
                    unit={activeUnit || ''}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                  />
                </div>
              )}

              {detectedReportType === 'sales' && (
                <div className="space-y-4">
                  <SalesReport
                    unit={activeUnit || ''}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                  />
                </div>
              )}

              {detectedReportType === 'appointments' && (
                <div className="space-y-4">
                  <AppointmentsReport
                    unit={activeUnit || ''}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                  />
                </div>
              )}

              {detectedReportType === 'clients' && (
                <div className="space-y-4">
                  <ClientsReport
                    unit={activeUnit || ''}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                  />
                </div>
              )}

              {detectedReportType === 'inventory' && (
                <div className="space-y-4">
                  <InventoryReport
                    unit={activeUnit || ''}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                  />
                </div>
              )}

              {detectedReportType === 'commissions' && (
                <div className="space-y-4">
                  <CommissionsReport
                    unit={activeUnit || ''}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                  />
                </div>
              )}

              {detectedReportType === 'cash-register' && (
                <div className="space-y-4">
                  <CashRegisterReport
                    unit={activeUnit || ''}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Loading State */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative overflow-hidden rounded-unit-lg border border-[var(--unit-border)]/60 bg-[var(--unit-surface)] shadow-unit-lg p-8 max-w-sm w-full">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--unit-accent)]/20 border-t-[var(--unit-accent)]"></div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-[var(--unit-text)]">Exportando Reporte</h3>
                <p className="text-sm text-[var(--unit-text-muted)]">Por favor espera...</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Notifications */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-unit border-2 shadow-unit animate-pulse ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
