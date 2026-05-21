'use client';

import { useState, useMemo, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { ReportOverview } from './ReportOverview';
import { ReportsMetrics } from './ReportsMetrics';
import { useUnitStore } from '@/store/unitStore';
import { Download, Filter, ChevronDown, ChevronUp, BarChart3, DollarSign, Calendar, Users, Package, TrendingUp, Building2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';
import { api } from '@/lib/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [dateFrom, setDateFrom] = useState(() => startOfDay(subDays(new Date(), 7)));
  const [dateTo, setDateTo] = useState(() => endOfDay(new Date()));
  const [showFilters, setShowFilters] = useState(true);
  
  // ✅ ELIMINADO: Estados no utilizados
  // const [reportTypeFilter, setReportTypeFilter] = useState<string>(''); // ❌ No usado
  // const [searchFilter, setSearchFilter] = useState<string>(''); // ❌ No usado
  
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  // Export modal states
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState<'excel' | 'pdf'>('excel');
  const [exportConfig, setExportConfig] = useState({
    unit: 'ALL' as 'ALL' | 'SPA' | 'BARBERIA',
    dateFrom: startOfDay(subDays(new Date(), 30)),
    dateTo: endOfDay(new Date()),
    includeLogo: true,
    includeTotals: true,
    includeBorders: true
  });

  // Reset export modal when closed
  useEffect(() => {
    if (!showExportModal) {
      setExportType('excel');
      setExportConfig({
        unit: 'ALL' as 'ALL' | 'SPA' | 'BARBERIA',
        dateFrom: startOfDay(subDays(new Date(), 30)),
        dateTo: endOfDay(new Date()),
        includeLogo: true,
        includeTotals: true,
        includeBorders: true
      });
    }
  }, [showExportModal]);

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
      // Simulate Excel export with mock data
      const mockData = [
        ['ID', 'Tipo', 'Fecha', 'Monto', 'Estado'],
        [1, detectedReportType, format(new Date(), 'dd/MM/yyyy'), 1500, 'Completado'],
        [2, detectedReportType, format(subDays(new Date(), 1), 'dd/MM/yyyy'), 2300, 'Pendiente'],
        [3, detectedReportType, format(subDays(new Date(), 2), 'dd/MM/yyyy'), 1800, 'Completado']
      ];
      
      // Create CSV content
      const csvContent = mockData.map(row => row.join(',')).join('\n');
      
      // Create blob and download
      const blob = new Blob([csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-${detectedReportType}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setNotification({type: 'success', message: 'Reporte Excel exportado exitosamente'});
      setShowExportModal(false);
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
      // Get unit colors for PDF styling
      const unitColors = exportConfig.unit === 'ALL' ? {
        primary: '#4A0E0E',
        accent: '#0028b3',
        secondary: '#F8F5FF'
      } : exportConfig.unit === 'SPA' ? {
        primary: '#6B46C1',
        accent: '#9333EA',
        secondary: '#F3E8FF'
      } : {
        primary: '#7A0A0A',
        accent: '#7A0A0A',
        secondary: '#FCFCFC'
      };

      // Create professional PDF with jsPDF
      const doc = new jsPDF();
      
      // Set font to support Spanish characters
      doc.setFont('helvetica');
      
      // Get page dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Header Section
      let currentY = 20;
      
      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      const reportTitle = detectedReportType === 'overview' ? 'REPORTE GENERAL' :
                       detectedReportType === 'sales' ? 'REPORTE DE VENTAS' :
                       detectedReportType === 'appointments' ? 'REPORTE DE CITAS' :
                       detectedReportType === 'clients' ? 'REPORTE DE CLIENTES' :
                       detectedReportType === 'inventory' ? 'REPORTE DE INVENTARIO' :
                       detectedReportType === 'commissions' ? 'REPORTE DE COMISIONES' :
                       'REPORTE DE CAJA';
      doc.text(reportTitle, pageWidth / 2, currentY, { align: 'center' });
      
      // Unit name
      currentY += 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      const unitName = exportConfig.unit === 'ALL' ? 'TODAS LAS UNIDADES' : 
                      exportConfig.unit === 'SPA' ? 'SPA' : 'BARBERÍA';
      doc.text(`Unidad: ${unitName}`, pageWidth / 2, currentY, { align: 'center' });
      
      // Date and period info (right aligned)
      currentY += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const dateStr = format(new Date(), 'dd/MM/yyyy');
      const periodStr = `${format(exportConfig.dateFrom, 'dd/MM/yyyy')} al ${format(exportConfig.dateTo, 'dd/MM/yyyy')}`;
      doc.text(`Fecha: ${dateStr}`, pageWidth - 60, currentY);
      currentY += 6;
      doc.text(`Período: ${periodStr}`, pageWidth - 60, currentY);
      
      // Logo placeholder if enabled
      if (exportConfig.includeLogo) {
        currentY += 15;
        doc.setDrawColor(unitColors.primary.replace('#', ''));
        doc.setFillColor(unitColors.secondary.replace('#', ''));
        doc.rect(pageWidth / 2 - 30, currentY, 60, 20, 'F');
        doc.setDrawColor(0);
        doc.text('LOGO', pageWidth / 2, currentY + 12, { align: 'center' });
        currentY += 25;
      } else {
        currentY += 15;
      }
      
      // Prepare table data
      const tableData = [
        [1, detectedReportType, format(new Date(), 'dd/MM/yyyy'), 'S/ 1500.00', 'Completado'],
        [2, detectedReportType, format(subDays(new Date(), 1), 'dd/MM/yyyy'), 'S/ 2300.00', 'Pendiente'],
        [3, detectedReportType, format(subDays(new Date(), 2), 'dd/MM/yyyy'), 'S/ 1800.00', 'Completado']
      ];
      
      // Calculate totals
      const totalAmount = tableData.reduce((sum, row) => sum + parseFloat(String(row[3]).replace('S/ ', '').replace(',', '')), 0);
      
      // Add table with autoTable
      autoTable(doc, {
        head: [['ID', 'Tipo', 'Fecha', 'Monto', 'Estado']],
        body: tableData,
        startY: currentY,
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [parseInt(unitColors.primary.slice(1, 3), 16), 
                     parseInt(unitColors.primary.slice(3, 5), 16), 
                     parseInt(unitColors.primary.slice(5, 7), 16)],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 15 }, // ID
          1: { cellWidth: 40 }, // Tipo
          2: { halign: 'center', cellWidth: 25 }, // Fecha
          3: { halign: 'right', cellWidth: 30 }, // Monto
          4: { halign: 'center', cellWidth: 25 }, // Estado
        },
        foot: [[
          { content: `TOTAL GENERAL`, colSpan: 4, styles: { fillColor: unitColors.secondary.replace('#', ''), textColor: unitColors.primary.replace('#', ''), fontStyle: 'bold' } },
          { content: `S/ ${totalAmount.toFixed(2)}`, styles: { halign: 'right', fillColor: unitColors.secondary.replace('#', ''), textColor: unitColors.primary.replace('#', ''), fontStyle: 'bold' } }
        ]],
        footStyles: {
          fillColor: unitColors.secondary.replace('#', ''),
          textColor: unitColors.primary.replace('#', ''),
          fontStyle: 'bold',
          lineWidth: 0.1,
        },
      });
      
      // Add page numbers (simplified for compatibility)
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Página 1 de 1', pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      // Save the PDF
      const fileName = `reporte_${detectedReportType}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);
      
      setNotification({type: 'success', message: 'Reporte PDF exportado exitosamente'});
      setShowExportModal(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports-metrics'] });
    },
    onError: (error: any) => {
      setNotification({type: 'error', message: 'Error al exportar reporte PDF'});
    }
  });

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
            unit={activeUnit || ''} 
          />

          {/* Enhanced Action Buttons - Estilo ClientsPage */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => {
                setExportType('excel');
                setShowExportModal(true);
              }}
              disabled={exportExcelMutation.isPending}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg border-2 border-emerald-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Download className="h-5 w-5" />
              {exportExcelMutation.isPending ? 'Exportando...' : 'Exportar Excel'}
            </button>
            <button
              onClick={() => {
                setExportType('pdf');
                setShowExportModal(true);
              }}
              disabled={exportPDFMutation.isPending}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold shadow-lg border-2 border-red-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Download className="h-5 w-5" />
              {exportPDFMutation.isPending ? 'Exportando...' : 'Exportar PDF'}
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
                showUnitFilter={false}
                showStatusFilter={false}
                className="rounded-xl"
              />


              {/* Enhanced Active Filters Summary - Simplificado */}
              {(activeUnit) && (
                <div className="rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Filtros activos:</span>
                      <div className="flex flex-wrap gap-2">
                        {activeUnit && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 border border-purple-200">
                            Unidad: {activeUnit === 'SPA' ? 'SPA' : 'Barbería'}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
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

      {/* Export Configuration Modal - Estilo Premium como Expenses */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowExportModal(false);
          }
        }}>
          <div className={`relative overflow-hidden rounded-2xl border-2 ${exportType === 'excel' ? 'border-green-500/50 bg-gradient-to-br from-green-50/95 to-green-100/85' : 'border-red-500/50 bg-gradient-to-br from-red-50/95 to-red-100/85'} backdrop-blur-md shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <div className="h-full w-full bg-repeat" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${exportType === 'excel' ? '10b981' : 'ef4444'}' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}></div>
            </div>

            {/* Header - Estándar consistente */}
            <div className="relative mb-6 flex items-start justify-between gap-4">
              {/* Background gradient for header - Consistente con Modal.tsx */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--unit-accent)]/20 to-transparent"></div>
              
              <div className="relative z-10 flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${exportType === 'excel' ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'} shadow-lg`}>
                  <Download className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Exportar a {exportType === 'excel' ? 'Excel' : 'PDF'}</h3>
                  <p className="text-sm text-[var(--unit-text-muted)]">Configura tu reporte personalizado</p>
                </div>
              </div>
              
              <button
                onClick={() => setShowExportModal(false)}
                className="relative z-10 shrink-0 rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)]/50 p-2 text-[var(--unit-text-muted)] transition-all duration-200 hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10 hover:text-[var(--unit-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="relative space-y-4">
              {/* Unit Selection */}
              <div className={`rounded-xl border-2 ${exportType === 'excel' ? 'border-green-200/50' : 'border-red-200/50'} bg-gradient-to-br from-white/70 to-white/50 p-4`}>
                <label className="block text-sm font-medium text-[var(--unit-text)] mb-2">
                  Unidad de Negocio
                </label>
                <select
                  value={exportConfig.unit}
                  onChange={(e) => setExportConfig((prev: any) => ({ ...prev, unit: e.target.value as any }))}
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)] px-4 py-2.5 text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                >
                  <option value="ALL">Todas las unidades</option>
                  <option value="SPA">SPA</option>
                  <option value="BARBERIA">Barbería</option>
                </select>
              </div>

              {/* Date Range */}
              <div className={`rounded-xl border-2 ${exportType === 'excel' ? 'border-green-200/50' : 'border-red-200/50'} bg-gradient-to-br from-white/70 to-white/50 p-4`}>
                <label className="block text-sm font-medium text-[var(--unit-text)] mb-3">
                  Período de Exportación
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--unit-text-muted)] mb-1">
                      Desde
                    </label>
                    <input
                      type="date"
                      value={exportConfig.dateFrom.toISOString().split('T')[0]}
                      onChange={(e) => setExportConfig((prev: any) => ({ ...prev, dateFrom: new Date(e.target.value) }))}
                      className="w-full rounded-lg border border-[var(--unit-border)]/50 bg-[var(--unit-surface)] px-3 py-2 text-sm text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--unit-text-muted)] mb-1">
                      Hasta
                    </label>
                    <input
                      type="date"
                      value={exportConfig.dateTo.toISOString().split('T')[0]}
                      onChange={(e) => setExportConfig((prev: any) => ({ ...prev, dateTo: new Date(e.target.value) }))}
                      className="w-full rounded-lg border border-[var(--unit-border)]/50 bg-[var(--unit-surface)] px-3 py-2 text-sm text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Include Logo */}
              <div className={`rounded-xl border-2 ${exportType === 'excel' ? 'border-green-200/50' : 'border-red-200/50'} bg-gradient-to-br from-white/70 to-white/50 p-4`}>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="includeLogo"
                    checked={exportConfig.includeLogo}
                    onChange={(e) => setExportConfig((prev: any) => ({ ...prev, includeLogo: e.target.checked }))}
                    className={`h-4 w-4 ${exportType === 'excel' ? 'text-green-600 border-green-300/50 focus:ring-green-500/50' : 'text-red-600 border-red-300/50 focus:ring-red-500/50'} rounded`}
                  />
                  <label htmlFor="includeLogo" className="text-sm font-medium text-[var(--unit-text)]">
                    Incluir logo del negocio
                  </label>
                </div>
              </div>

              {/* Additional Options */}
              <div className={`rounded-xl border-2 ${exportType === 'excel' ? 'border-green-200/50' : 'border-red-200/50'} bg-gradient-to-br from-white/70 to-white/50 p-4`}>
                <label className="block text-sm font-medium text-[var(--unit-text)] mb-3">
                  Opciones Adicionales
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="includeTotals"
                      checked={exportConfig.includeTotals}
                      onChange={(e) => setExportConfig((prev: any) => ({ ...prev, includeTotals: e.target.checked }))}
                      className={`h-4 w-4 ${exportType === 'excel' ? 'text-green-600 border-green-300/50 focus:ring-green-500/50' : 'text-red-600 border-red-300/50 focus:ring-red-500/50'} rounded`}
                    />
                    <label htmlFor="includeTotals" className="text-sm font-medium text-[var(--unit-text)]">
                      Incluir totales y resúmenes
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="includeBorders"
                      checked={exportConfig.includeBorders}
                      onChange={(e) => setExportConfig((prev: any) => ({ ...prev, includeBorders: e.target.checked }))}
                      className={`h-4 w-4 ${exportType === 'excel' ? 'text-green-600 border-green-300/50 focus:ring-green-500/50' : 'text-red-600 border-red-300/50 focus:ring-red-500/50'} rounded`}
                    />
                    <label htmlFor="includeBorders" className="text-sm font-medium text-[var(--unit-text)]">
                      Incluir bordes en todas las celdas
                    </label>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className={`rounded-xl border-2 ${exportType === 'excel' ? 'border-green-300/50 bg-gradient-to-br from-green-50 to-green-100' : 'border-red-300/50 bg-gradient-to-br from-red-50 to-red-100'} p-4`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`h-2 w-2 rounded-full ${exportType === 'excel' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                  <span className="text-xs font-medium text-[var(--unit-text-muted)] uppercase tracking-wider">Vista Previa</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--unit-text-muted)]">Unidad</span>
                    <span className="text-sm font-medium text-[var(--unit-text)]">
                      {exportConfig.unit === 'ALL' ? 'Todas' : exportConfig.unit === 'SPA' ? 'SPA' : 'Barbería'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--unit-text-muted)]">Período</span>
                    <span className="text-sm font-medium text-[var(--unit-text)]">
                      {format(exportConfig.dateFrom, 'dd/MM/yyyy')} - {format(exportConfig.dateTo, 'dd/MM/yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--unit-text-muted)]">Logo</span>
                    <span className="text-sm font-medium text-[var(--unit-text)]">
                      {exportConfig.includeLogo ? 'Incluido' : 'No incluido'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--unit-text-muted)]">Totales</span>
                    <span className="text-sm font-medium text-[var(--unit-text)]">
                      {exportConfig.includeTotals ? 'Incluidos' : 'No incluidos'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--unit-text-muted)]">Bordes</span>
                    <span className="text-sm font-medium text-[var(--unit-text)]">
                      {exportConfig.includeBorders ? 'Incluidos' : 'No incluidos'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => exportType === 'excel' ? exportExcelMutation.mutate() : exportPDFMutation.mutate()}
                disabled={exportExcelMutation.isPending || exportPDFMutation.isPending}
                className={`flex-1 rounded-xl bg-gradient-to-r ${exportType === 'excel' ? 'from-green-600 to-green-700 border-green-500/50' : 'from-red-600 to-red-700 border-red-500/50'} text-white font-bold shadow-lg border-2 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100`}
              >
                {(exportExcelMutation.isPending || exportPDFMutation.isPending) ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                    Exportando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Download className="h-4 w-4" />
                    Exportar {exportType === 'excel' ? 'Excel' : 'PDF'}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className={`flex-1 rounded-xl border-2 ${exportType === 'excel' ? 'border-green-300/50 text-green-700 hover:bg-green-50' : 'border-red-300/50 text-red-700 hover:bg-red-50'} px-6 py-3 text-sm font-medium bg-white/80 transition-all hover:shadow-lg active:scale-[0.98]`}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
