'use client';

import { useState, useMemo, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { ReportOverview } from './ReportOverview';
import { ReportsMetrics } from './ReportsMetrics';
import { Download, Filter, ChevronDown, ChevronUp, BarChart3, DollarSign, Calendar, Users, Package, TrendingUp, Building2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { api } from '@/lib/api';

type BusinessUnit = 'SPA' | 'BARBERIA' | '';

// Lazy loading para componentes pesados
const SalesReport = dynamic(() => import('./SalesReport').then(mod => ({ default: mod.SalesReport })), {
  loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-lg" />,
  ssr: false
});

const AppointmentsReport = dynamic(() => import('./AppointmentsReport').then(mod => ({ default: mod.AppointmentsReport })), {
  loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-lg" />,
  ssr: false
});

const ClientsReport = dynamic(() => import('./ClientsReport').then(mod => ({ default: mod.ClientsReport })), {
  loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-lg" />,
  ssr: false
});

const InventoryReport = dynamic(() => import('./InventoryReport').then(mod => ({ default: mod.InventoryReport })), {
  loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-lg" />,
  ssr: false
});

const CommissionsReport = dynamic(() => import('./CommissionsReport').then(mod => ({ default: mod.CommissionsReport })), {
  loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-lg" />,
  ssr: false
});

const CashRegisterReport = dynamic(() => import('./CashRegisterReport').then(mod => ({ default: mod.CashRegisterReport })), {
  loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-lg" />,
  ssr: false
});

export function ReportsPage(): JSX.Element {
  const pathname = usePathname();
  
  // Auto-detect report type from URL
  const detectedReportType = useMemo(() => {
    if (pathname.includes('/sales')) return 'sales';
    if (pathname.includes('/appointments')) return 'appointments';
    if (pathname.includes('/clients')) return 'clients';
    if (pathname.includes('/inventory')) return 'inventory';
    if (pathname.includes('/commissions')) return 'commissions';
    if (pathname.includes('/cash')) return 'cash-register';
    return 'overview'; // Default for main /reports page
  }, [pathname]);

  const [unit, setUnit] = useState<string>('');
  const [dateFrom, setDateFrom] = useState(() => startOfDay(subDays(new Date(), 7)));
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

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    setLoading(true);
    try {
      // ✅ MEJORADO: Implement export functionality
      const params = new URLSearchParams({
        unit: unit || '',
        from: dateFrom.toISOString(),
        to: dateTo.toISOString(),
        format,
      });

      let endpoint = '';
      switch (detectedReportType) {
        case 'sales':
          endpoint = `/api/reports/sales/export?${params}`;
          break;
        case 'appointments':
          endpoint = `/api/reports/appointments/export?${params}`;
          break;
        case 'clients':
          endpoint = `/api/reports/clients/export?${params}`;
          break;
        case 'inventory':
          endpoint = `/api/reports/inventory/export?${params}`;
          break;
        case 'commissions':
          endpoint = `/api/reports/commissions/export?${params}`;
          break;
        case 'cash-register':
          endpoint = `/api/reports/cash-register/export?${params}`;
          break;
        default:
          endpoint = `/api/reports/overview/export?${params}`;
      }

      const response = await api.get(endpoint, {
        responseType: format === 'pdf' ? 'blob' : 'json',
      });

      // ✅ MEJORADO: Handle different response types
      if (format === 'pdf') {
        // Create blob and download
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-${detectedReportType}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (format === 'excel') {
        // Handle Excel/CSV download
        const blob = new Blob([response.data], { 
          type: format === 'excel' 
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-${detectedReportType}-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      alert(`Reporte exportado exitosamente en formato ${format.toUpperCase()}`);
      setNotification({type: 'success', message: `Reporte exportado exitosamente en formato ${format.toUpperCase()}`});
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Error al exportar reporte: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setNotification({type: 'error', message: `Error al exportar reporte: ${error instanceof Error ? error.message : 'Error desconocido'}`});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--unit-surface)] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header - Exacto estilo ClientsPage */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-4">
              <div className="h-2 w-2 rounded-full bg-[var(--unit-accent)] animate-pulse"></div>
              <span className="text-sm font-medium text-[var(--unit-text)]">
                Sistema de Reportes
              </span>
            </div>
            <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">Reportes</h1>
            <p className="text-[var(--unit-text-muted)]">
              {detectedReportType === 'overview' 
                ? 'Resumen general de todas las áreas del sistema'
                : `Reporte detallado de ${detectedReportType === 'sales' ? 'ventas' : 
                             detectedReportType === 'appointments' ? 'citas' : 
                             detectedReportType === 'clients' ? 'clientes' : 
                             detectedReportType === 'inventory' ? 'inventario' : 
                             detectedReportType === 'commissions' ? 'comisiones' : 'cajas'}`
              }
            </p>
          </div>

          {/* Reports Metrics */}
          <ReportsMetrics 
            reportType={detectedReportType} 
            dateFrom={dateFrom} 
            dateTo={dateTo} 
            unit={unit} 
          />

          {/* Enhanced Action Buttons - Estilo ClientsPage */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => handleExport('excel')}
              disabled={loading}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg border-2 border-emerald-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="h-5 w-5" />
              Exportar Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={loading}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold shadow-lg border-2 border-red-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="h-5 w-5" />
              Exportar PDF
            </button>
          </div>
        </div>

        {/* Enhanced Reports Filters - Exacto estilo ClientsPage */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6 mb-8">
          {/* Filter Header - Exacto estilo ClientsPage */}
          <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Filtros de Reportes</h3>
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

          {/* Filter Content - Exacto estilo ClientsPage */}
          {showFilters && (
            <div className="space-y-6">
              {/* Date Range Filter */}
              <DateRangeFilter
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={(date: Date | null) => date && setDateFrom(date)}
                onDateToChange={(date: Date | null) => date && setDateTo(date)}
                unit={unit}
                onUnitChange={setUnit}
                showUnitFilter={true}
                showStatusFilter={false}
                className="rounded-xl"
              />

              {/* Additional Filter Controls - Solo Unidad */}
              <div className="max-w-md">
                {/* Unit Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Unidad</label>
                  <select
                    value={unit}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                    onChange={(e) => setUnit(e.target.value)}
                  >
                    <option value="">Todas las unidades</option>
                    <option value="SPA">SPA</option>
                    <option value="BARBERIA">Barbería</option>
                  </select>
                </div>
              </div>

              {/* Enhanced Active Filters Summary - Simplificado */}
              {unit !== '' && (
                <div className="rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Filtros activos:</span>
                      <div className="flex flex-wrap gap-2">
                        {unit && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 border border-purple-200">
                            Unidad: {unit === 'SPA' ? 'SPA' : 'Barbería'}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setUnit('');
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

        {/* Enhanced Reports Table - Premium Glassmorphism */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-8">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="h-full w-full bg-repeat" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>
          
          <div className="relative">
            {/* Premium Table Header */}
            <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-8 -mt-8 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                    <Download className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--unit-text)]">Lista de Reportes</h3>
                    <p className="text-sm text-[var(--unit-text-muted)]">Visualización de datos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-[var(--unit-accent)]/20 px-3 py-1.5 text-sm font-bold text-[var(--unit-accent)] border border-[var(--unit-accent)]/30 shadow-sm">
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
            <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6">
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
                    unit={unit}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                  />
                </div>
              )}

              {detectedReportType === 'sales' && (
                <div className="space-y-4">
                  <SalesReport
                    unit={unit}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                  />
                </div>
              )}

              {detectedReportType === 'appointments' && (
                <div className="space-y-4">
                  <AppointmentsReport
                    unit={unit}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                  />
                </div>
              )}

              {detectedReportType === 'clients' && (
                <div className="space-y-4">
                  <ClientsReport
                    unit={unit}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                  />
                </div>
              )}

              {detectedReportType === 'inventory' && (
                <div className="space-y-4">
                  <InventoryReport
                    unit={unit}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                  />
                </div>
              )}

              {detectedReportType === 'commissions' && (
                <div className="space-y-4">
                  <CommissionsReport
                    unit={unit}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                  />
                </div>
              )}

              {detectedReportType === 'cash-register' && (
                <div className="space-y-4">
                  <CashRegisterReport
                    unit={unit}
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
          <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-accent)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-8 max-w-sm w-full">
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
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl border-2 shadow-lg animate-pulse ${
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
