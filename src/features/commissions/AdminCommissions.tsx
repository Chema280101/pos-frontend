import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format, startOfDay, endOfDay, subDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useUnitStore } from '../../store/unitStore';
import { useToastStore } from '../../store/toastStore';
import { DollarSign, User, Calendar, Receipt, Building2, CheckCircle, Clock, XCircle, Eye, X, RefreshCw, Download, Search, Filter, ChevronDown, ChevronUp, AlertCircle, TrendingUp } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { CommissionsMetrics } from './CommissionsMetrics';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Commission, GroupedCommission, CommissionsResponse, CommissionStatus } from '@/types/commission';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export function AdminCommissions(): JSX.Element {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const activeUnit = useUnitStore((s) => s.activeUnit);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<Date>(startOfDay(new Date()));
  const [dateTo, setDateTo] = useState<Date>(endOfDay(new Date()));
  const [showFilters, setShowFilters] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [viewModal, setViewModal] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<GroupedCommission | null>(null);
  const [recalculatingId, setRecalculatingId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState<'excel' | 'pdf'>('excel');
  const [exportConfig, setExportConfig] = useState({
    unit: 'ALL' as 'ALL' | 'SPA' | 'BARBERIA',
    dateFrom: startOfDay(subDays(new Date(), 30)),
    dateTo: endOfDay(new Date()),
    includeLogo: true,
    includeTotals: true,
    includeBorders: true,
    filterByEmployee: false,
    filterByPaymentMethod: false,
    selectedEmployee: '',
    selectedPaymentMethod: ''
  });

  // ✅ MEJORADO: Enviar filtros al backend
  const { data: commissionsResponse, isLoading, error } = useQuery({
    queryKey: ['commissions', 'all', activeUnit, statusFilter, searchFilter, dateFrom, dateTo],
    queryFn: async (): Promise<CommissionsResponse> => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (activeUnit) params.append('unit', activeUnit);
      if (searchFilter) params.append('search', searchFilter);
      if (dateFrom) params.append('dateFrom', dateFrom.toISOString());
      if (dateTo) params.append('dateTo', dateTo.toISOString());
      params.append('page', '1');
      params.append('limit', '100'); // Obtener hasta 100 comisiones
      
      const response = await api.get(`/api/commissions/all?${params}`);
      return response.data;
    },
  });

  // ✅ EXTRAER: Commissions del response (ya viene filtrado del backend)
  const commissions = commissionsResponse?.data ?? [];

  // 🎯 Obtener lista única de empleados para el filtro
  const uniqueEmployees = useMemo(() => {
    if (!commissionsResponse?.data) return [];
    
    const employees = new Set<string>();
    commissionsResponse.data.forEach(commission => {
      if (commission.user?.name) {
        employees.add(commission.user.name);
      }
    });
    
    return Array.from(employees).sort();
  }, [commissionsResponse]);

  // El backend ya envía los datos agrupados, no necesitamos agruparlos nuevamente
  const groupedCommissions = commissions;

  // Calculate stats
  const pending = commissions.filter((c: GroupedCommission) => c.status === 'PENDING');
  const paid = commissions.filter((c: GroupedCommission) => c.status === 'PAID');
  const approved = commissions.filter((c: GroupedCommission) => c.status === 'APPROVED');
  
  const totalPending = pending.reduce((sum: number, c: GroupedCommission) => sum + c.totalAmount, 0);
  const totalPaid = paid.reduce((sum: number, c: GroupedCommission) => sum + c.totalAmount, 0);
  const totalApproved = approved.reduce((sum: number, c: GroupedCommission) => sum + c.totalAmount, 0);

  const markPaidMutation = useMutation({
    mutationFn: async ({ groupId, method, notes }: { groupId: string; method: string; notes: string }) => {
      // Find the group and mark all commissions as paid
      const group = groupedCommissions.find(g => g.id === groupId);
      if (!group) throw new Error('Group not found');
      
      console.log('DEBUG - Group structure:', group);
      console.log('DEBUG - Group properties:', Object.keys(group));
      console.log('DEBUG - Group ID type:', typeof group.id);
      console.log('DEBUG - Is consolidated ID?', group.id.includes('consolidated_'));
      
      // Mark all commissions in the group as paid
      // Si el ID es consolidado, necesitamos encontrar las comisiones individuales
      let commissionsToMark;
      
      if (group.id.includes('consolidated_')) {
        // ✅ Usar los IDs de comisiones reales del campo commissionIds
        if (group.commissionIds && Array.isArray(group.commissionIds) && group.commissionIds.length > 0) {
          console.log('DEBUG - Using commissionIds from consolidated group:', group.commissionIds);
          commissionsToMark = group.commissionIds.map(id => ({ id }));
        } else if (group.sales && Array.isArray(group.sales)) {
          // Fallback: Usar IDs de sales si commissionIds no está disponible
          console.log('DEBUG - commissionIds not available, using sales IDs');
          commissionsToMark = group.sales.map((sale: any) => ({ id: sale.id }));
        } else {
          throw new Error('No commission IDs or sales data found in consolidated commission');
        }
      } else {
        // Es una comisión individual
        commissionsToMark = [group];
      }
      
      const promises = commissionsToMark.map(commission => 
        api.patch(`/api/commissions/${commission.id}/paid`, {
        paymentMethod: method || undefined,
        paymentNotes: notes || undefined,
        })
      );
      
      await Promise.all(promises);
      return group;
    },
    onSuccess: (data) => {
      setPayingId(null);
      setPaymentMethod('Efectivo');
      setPaymentNotes('');
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      
      // Acceder correctamente a los datos del grupo
      const commissionCount = data.commissionCount || data.sales?.length || 0;
      const totalAmount = data.totalAmount || 0;
      
      addToast(`Comisiones liquidadas: ${commissionCount} comisiones por S/ ${totalAmount.toFixed(2)}`, 'success');
    },
    onError: (error: any) => {
      console.error('Error marking commission as paid:', error);
      addToast(error.response?.data?.error || 'Error al liquidar comisiones', 'error');
    },
  });

  // Void commission mutation
  const voidMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/api/commissions/${id}/void`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      alert('Comisión anulada exitosamente');
    },
    onError: (error) => {
      alert('Error al anular la comisión');
    },
  });

  // Recalculate commission mutation
  const recalculateMutation = useMutation({
    mutationFn: async (groupId: string) => {
      // Find the group and recalculate all commissions individually
      const group = groupedCommissions.find(g => g.id === groupId);
      if (!group) throw new Error('Group not found');
      
      // Recalculate all commissions in the group
      const promises = group.commissions.map(commission => 
        api.patch(`/api/commissions/${commission.id}/recalculate`)
      );
      
      await Promise.all(promises);
      return group;
    },
    onSuccess: () => {
      setRecalculatingId(null);
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      addToast('Comisiones recalculadas exitosamente', 'success');
    },
    onError: (error) => {
      setRecalculatingId(null);
      addToast('Error al recalcular comisiones', 'error');
    },
  });

  // Export Excel mutation - Professional version with exceljs and unit colors
  const exportExcelMutation = useMutation({
    mutationFn: async () => {
      // Get unit colors
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

      // Create professional Excel workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Reporte de Comisiones');

      // Define styles using unit colors
      const titleStyle: Partial<ExcelJS.Style> = {
        font: { name: 'Calibri', size: 16, bold: true, color: { argb: unitColors.primary.replace('#', 'FF') } },
        alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: unitColors.secondary.replace('#', 'FF') } }
      };

      const headerStyle: Partial<ExcelJS.Style> = {
        font: { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } },
        alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: unitColors.accent.replace('#', 'FF') } },
        border: {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } }
        }
      };

      const subHeaderStyle: Partial<ExcelJS.Style> = {
        font: { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF000000' } },
        alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } },
        border: {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } }
        }
      };

      const dataStyle: Partial<ExcelJS.Style> = {
        font: { name: 'Calibri', size: 11, color: { argb: 'FF000000' } },
        alignment: { horizontal: 'left' as const, vertical: 'middle' as const },
        border: {
          top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          right: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } }
        }
      };

      const numberStyle: Partial<ExcelJS.Style> = {
        ...dataStyle,
        alignment: { horizontal: 'right' as const, vertical: 'middle' as const },
        numFmt: '"S/" #,##0.00'
      };

      const percentStyle: Partial<ExcelJS.Style> = {
        ...dataStyle,
        alignment: { horizontal: 'right' as const, vertical: 'middle' as const },
        numFmt: '0.00%'
      };

      // Add logo if enabled
      if (exportConfig.includeLogo) {
        const logoRow = worksheet.getRow(1);
        logoRow.height = 60;
        worksheet.mergeCells('A1:C1');
        
        // Add actual logo image
        const logoCell = worksheet.getCell('A1');
        
        try {
          // Determine which logo to use
          let logoPath = '';
          if (exportConfig.unit === 'SPA') {
            logoPath = '/logo-spa.png';
          } else if (exportConfig.unit === 'BARBERIA') {
            logoPath = '/logo-barberia.png';
          } else {
            logoPath = '/logo.png'; // Default logo for ALL
          }
          
          // Fetch the logo image
          const response = await fetch(logoPath);
          const arrayBuffer = await response.arrayBuffer();
          
          // Add image to worksheet with proper typing
          const imageId = workbook.addImage({
            buffer: arrayBuffer as any,
            extension: 'png',
          });
          
          // Add image to merged cell area with simplified positioning
          worksheet.addImage(imageId, 'A1:C1');
          
        } catch (error) {
          // Fallback to text placeholder if image fails
          logoCell.value = exportConfig.unit === 'ALL' ? 'LOGO' : 
                          exportConfig.unit === 'SPA' ? 'SPA LOGO' : 'BARBERÍA LOGO';
          logoCell.style = {
            font: { name: 'Calibri', size: 14, bold: true, color: { argb: unitColors.primary.replace('#', 'FF') } },
            alignment: { horizontal: 'center', vertical: 'middle' },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: unitColors.secondary.replace('#', 'FF') } },
            border: {
              top: { style: 'thin', color: { argb: unitColors.primary.replace('#', 'FF') } },
              left: { style: 'thin', color: { argb: unitColors.primary.replace('#', 'FF') } },
              right: { style: 'thin', color: { argb: unitColors.primary.replace('#', 'FF') } },
              bottom: { style: 'thin', color: { argb: unitColors.primary.replace('#', 'FF') } }
            }
          };
        }
      }

      // Add title row (merged)
      const titleRowNumber = exportConfig.includeLogo ? 2 : 1;
      const titleRow = worksheet.getRow(titleRowNumber);
      titleRow.height = 25;
      const unitName = exportConfig.unit === 'ALL' ? 'TODAS LAS UNIDADES' : 
                      exportConfig.unit === 'SPA' ? 'SPA' : 'BARBERÍA';
      titleRow.values = [`LIBRO DE REPORTE DE COMISIONES - ${unitName}`];
      titleRow.getCell(1).style = titleStyle;
      worksheet.mergeCells(`A${titleRowNumber}:L${titleRowNumber}`);

      // Add date row (merged)
      const dateRowNumber = exportConfig.includeLogo ? 3 : 2;
      const dateRow = worksheet.getRow(dateRowNumber);
      dateRow.height = 20;
      dateRow.values = [`Fecha: ${new Date().toLocaleDateString('es-ES')} | Período: ${exportConfig.dateFrom.toLocaleDateString('es-ES')} al ${exportConfig.dateTo.toLocaleDateString('es-ES')}`];
      dateRow.getCell(1).style = {
        font: { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF666666' } },
        alignment: { horizontal: 'center', vertical: 'middle' }
      };
      worksheet.mergeCells(`A${dateRowNumber}:L${dateRowNumber}`);

      // Add empty row
      worksheet.addRow([]);

      // Add main headers (2 levels)
      const headerStartRow = exportConfig.includeLogo ? 5 : 4;
      const headerRow1 = worksheet.getRow(headerStartRow);
      headerRow1.height = 20;
      headerRow1.values = ['', 'DATOS DEL EMPLEADO', '', '', 'DETALLE DE VENTA', '', '', '', '', 'DETALLE DE PAGO', '', ''];
      
      // Style main headers
      headerRow1.getCell(2).style = headerStyle;
      headerRow1.getCell(5).style = headerStyle;
      headerRow1.getCell(10).style = headerStyle;
      
      // Merge main headers
      worksheet.mergeCells(`B${headerStartRow}:D${headerStartRow}`); // Datos del Empleado
      worksheet.mergeCells(`E${headerStartRow}:I${headerStartRow}`); // Detalle de Venta  
      worksheet.mergeCells(`J${headerStartRow}:L${headerStartRow}`); // Detalle de Pago

      // Add sub headers
      const headerRow2 = worksheet.getRow(headerStartRow + 1);
      headerRow2.height = 18;
      headerRow2.values = ['ID', 'Nombre', 'Unidad', 'Estado', 'ID Venta', 'Número Venta', 'Fecha Creación', 'Monto', '% Comisión', 'Fecha Pago', 'Método Pago', 'Notas'];
      
      // Style sub headers
      for (let i = 1; i <= 12; i++) {
        headerRow2.getCell(i).style = subHeaderStyle;
      }

      // Filter commissions by unit and date
      const filteredCommissions = commissions.filter(c => {
        const commissionDate = parseISO(c.createdAt);
        const unitMatch = exportConfig.unit === 'ALL' || c.user.unit === exportConfig.unit;
        const dateMatch = commissionDate >= exportConfig.dateFrom && commissionDate <= exportConfig.dateTo;
        return unitMatch && dateMatch;
      });

      // Add data rows
      let dataRowNumber = headerStartRow + 2;
      filteredCommissions.forEach((commission: any) => {
        const dataRow = worksheet.getRow(dataRowNumber);
        dataRow.height = 20;
        
        // Format date
        const createdDate = parseISO(commission.createdAt);
        const formattedDate = format(createdDate, 'dd/MM/yyyy');
        
        // Format payment date if exists
        const paymentDate = commission.paidAt ? format(parseISO(commission.paidAt), 'dd/MM/yyyy') : '';
        
        // Calculate commission percentage
        const commissionPercentage = commission.totalAmount && commission.sale ? 
          ((commission.totalAmount / commission.sale.total) * 100).toFixed(2) + '%' : '0.00%';
        
        dataRow.values = [
          commission.id,
          commission.employeeName || commission.userName || '',
          commission.employeeUnit || commission.userUnit || '',
          formattedDate,
          commission.totalAmount || 0,
          commissionPercentage,
          paymentDate,
          commission.paymentMethod || '',
          commission.paymentNotes || ''
        ];
        
        // Apply styles to data row
        for (let col = 1; col <= 9; col++) {
          const cell = dataRow.getCell(col);
          if (col === 5 || col === 7) { // Amount and payment date columns
            cell.style = numberStyle;
          } else if (col === 6) { // Percentage column
            cell.style = percentStyle;
          } else {
            cell.style = dataStyle;
          }
        }
        
        dataRowNumber++;
        dataRow.getCell(12).style = dataStyle; // Notas
      });

      // Set column widths
      worksheet.getColumn(1).width = 15; // ID
      worksheet.getColumn(2).width = 25; // Nombre
      worksheet.getColumn(3).width = 12; // Unidad
      worksheet.getColumn(4).width = 12; // Estado
      worksheet.getColumn(5).width = 20; // ID Venta
      worksheet.getColumn(6).width = 18; // Número Venta
      worksheet.getColumn(7).width = 20; // Fecha Creación
      worksheet.getColumn(8).width = 15; // Monto
      worksheet.getColumn(9).width = 12; // % Comisión
      worksheet.getColumn(10).width = 20; // Fecha Pago
      worksheet.getColumn(11).width = 15; // Método Pago
      worksheet.getColumn(12).width = 25; // Notas

      // Add totals row
      const totalRow = worksheet.getRow((headerStartRow + 2) + filteredCommissions.length);
      totalRow.height = 20;
      const totalAmount = filteredCommissions.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
      totalRow.values = ['', '', '', '', '', '', '', 'TOTAL:', totalAmount, '', '', '', ''];
      
      totalRow.getCell(8).style = {
        font: { name: 'Calibri', size: 12, bold: true, color: { argb: unitColors.primary.replace('#', 'FF') } },
        alignment: { horizontal: 'right', vertical: 'middle' },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: unitColors.secondary.replace('#', 'FF') } },
        border: {
          top: { style: 'double', color: { argb: unitColors.primary.replace('#', 'FF') } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'double', color: { argb: unitColors.primary.replace('#', 'FF') } }
        },
        numFmt: '"S/" #,##0.00'
      };

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return buffer;
    },
    onSuccess: (data) => {
      // Generate filename with export config
      const dateStr = new Date().toISOString().split('T')[0];
      let filename = `reporte_comisiones_${dateStr}`;
      if (exportConfig.unit !== 'ALL') filename += `_${exportConfig.unit.toLowerCase()}`;
      filename += '.xlsx';

      // Save file using file-saver
      saveAs(new Blob([data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8' 
      }), filename);

      addToast('Reporte de comisiones exportado a Excel exitosamente', 'success');
      setShowExportModal(false);
    },
    onError: (error) => {
      addToast('Error al exportar comisiones a Excel', 'error');
    },
  });


  // Export PDF mutation - Profesional con jsPDF
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

      // Filter commissions based on export configuration
      let filteredCommissions = commissions;
      
      // Filter by unit
      if (exportConfig.unit !== 'ALL') {
        filteredCommissions = filteredCommissions.filter(commission => 
          commission.user.unit === exportConfig.unit
        );
      }
      
      // Filter by date range
      filteredCommissions = filteredCommissions.filter(commission => {
        const commissionDate = parseISO(commission.createdAt);
        return commissionDate >= exportConfig.dateFrom && commissionDate <= exportConfig.dateTo;
      });
      
      // Filter by employee
      if (exportConfig.filterByEmployee && exportConfig.selectedEmployee) {
        filteredCommissions = filteredCommissions.filter(commission => 
          commission.user.name === exportConfig.selectedEmployee
        );
      }
      
      // Filter by payment method
      if (exportConfig.filterByPaymentMethod && exportConfig.selectedPaymentMethod) {
        filteredCommissions = filteredCommissions.filter(commission => 
          commission.paymentMethod === exportConfig.selectedPaymentMethod
        );
      }

      // Use filtered commissions directly (backend already groups them)
      const filteredGroupedCommissions = filteredCommissions;

      // Create professional PDF with jsPDF
      const doc = new jsPDF();
      
      // Set font to support Spanish characters
      doc.setFont('helvetica');
      
      // Add custom font for better Spanish support (if needed)
      // For now, we'll use built-in fonts
      
      // Get page dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Header Section
      let currentY = 20;
      
      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTE DE COMISIONES', pageWidth / 2, currentY, { align: 'center' });
      
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
      const dateStr = new Date().toLocaleDateString('es-ES');
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
      const tableData = filteredGroupedCommissions.map((group, index) => [
        index + 1, // ID
        group.employeeName || '',
        (group.employeeUnit as string) === 'BARBERIA' ? 'Barbería' : 'SPA',
        format(parseISO(group.date), 'dd/MM/yyyy'),
        (group.commissionCount || group.totalSales || 0).toString(),
        group.status === 'PENDING' ? 'Pendiente' : 
        group.status === 'APPROVED' ? 'Aprobada' : 
        group.status === 'PAID' ? 'Pagada' : 'Mixto',
        `S/ ${group.totalAmount.toFixed(2)}`
      ]).filter(row => row.every(cell => cell !== undefined));
      
      // Calculate totals
      const totalAmount = filteredGroupedCommissions.reduce((sum, group) => sum + group.totalAmount, 0);
      
      // Add table with autoTable
      autoTable(doc, {
        head: [['ID', 'Empleado', 'Unidad', 'Fecha', 'Ventas', 'Estado', 'Monto Total']],
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
          1: { cellWidth: 40 }, // Empleado
          2: { halign: 'center', cellWidth: 25 }, // Unidad
          3: { halign: 'center', cellWidth: 25 }, // Fecha
          4: { halign: 'center', cellWidth: 20 }, // Ventas
          5: { halign: 'center', cellWidth: 25 }, // Estado
          6: { halign: 'right', cellWidth: 30 }, // Monto Total
        },
        // didDrawCell and didDrawRow removed for compatibility
        foot: [[
          { content: `TOTAL GENERAL`, colSpan: 6, styles: { fillColor: unitColors.secondary.replace('#', ''), textColor: unitColors.primary.replace('#', ''), fontStyle: 'bold' } },
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
      const fileName = `reporte_comisiones_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);
      
      addToast('PDF exportado exitosamente', 'success');
      setShowExportModal(false); // Close modal after successful export
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
    },
    onError: (error) => {
      addToast('Error al exportar comisiones a PDF', 'error');
    },
  });

  // Helper function to generate CSV
  const generateCSV = (data: Commission[]): string => {
    const headers = [
      'ID',
      'Empleado',
      'Unidad',
      'Monto',
      '% Comisión',
      'Estado',
      'Fecha Creación',
      'Fecha Pago',
      'Método Pago',
      'Notas',
      'ID Venta',
      'Número Venta'
    ];
    
    const rows = data.map(c => [
      c.id,
      c.user.name,
      c.user.unit || '',
      c.amount.toFixed(2),
      c.pctApplied.toString(),
      c.status === 'PENDING' ? 'Pendiente' : 
       c.status === 'APPROVED' ? 'Aprobada' : 'Pagada',
      parseISO(c.createdAt).toLocaleString('es-PE'),
      c.paidAt ? parseISO(c.paidAt).toLocaleString('es-PE') : '',
      c.paymentMethod || '',
      c.paymentNotes || '',
      c.sale?.id || '',
      c.sale?.saleNumber || ''
    ]);
    
    // Create CSV with proper formatting for Excel
    const csvContent = [headers, ...rows]
      .map(row => 
        row.map(cell => {
          // Handle special characters and commas
          const cellStr = cell.toString();
          // If cell contains comma, quote, or newline, wrap in quotes and escape quotes
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return '"' + cellStr.replace(/"/g, '""') + '"';
          }
          return cellStr;
        }).join(',')
      )
      .join('\n');
      
    return csvContent;
  };

  // Helper functions
  const getAmountRange = (amount: number) => {
    if (amount < 50) return '0-50';
    if (amount < 100) return '50-100';
    if (amount < 200) return '100-200';
    if (amount < 500) return '200-500';
    return '500+';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID': return <CheckCircle className="h-3 w-3" />;
      case 'APPROVED': return <Clock className="h-3 w-3" />;
      case 'PENDING': return <XCircle className="h-3 w-3" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    {
      key: 'employee',
      header: 'Empleado',
      sortable: true,
      render: (row: any) => (
        <span className="font-medium text-[var(--unit-text-muted)]">
          {row.employeeName || row.userName}
        </span>
      ),
    },
    {
      key: 'unit',
      header: 'Unidad',
      sortable: true,
      render: (row: any) => (
        <span className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          (row.employeeUnit || row.userUnit) === 'SPA'
            ? 'bg-purple-100 text-purple-800'
            : 'bg-red-100 text-red-800'
        )}>
          {(row.employeeUnit || row.userUnit) === 'BARBERIA' ? 'Barbería' : 'SPA'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Fecha',
      sortable: true,
      render: (row: any) => {
        // Usar campo date del backend consolidado, o createdAt como fallback
        const commissionDate = row.date ? parseISO(row.date) : parseISO(row.createdAt);
        const today = new Date();
        const isToday = commissionDate.toDateString() === today.toDateString();
        
        return (
          <div className="flex flex-col gap-1">
            <span className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              isToday 
                ? 'bg-green-100 text-green-800' 
                : 'bg-indigo-100 text-indigo-800'
            )}>
              {format(commissionDate, 'd MMM yyyy', { locale: es })}
              {isToday && ' (Hoy)'}
            </span>
            <span className="text-xs text-[var(--unit-text-muted)]">
              {row.totalSales || row.commissionCount || 1} {(row.totalSales || row.commissionCount) === 1 ? 'comisión' : 'comisiones'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'totalSales',
      header: 'Ventas',
      sortable: true,
      render: (row: any) => (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
          {row.totalSales || row.commissionCount || 1}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Comisión Total',
      sortable: true,
      render: (row: any) => (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800">
          S/ {(row.totalAmount || 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row: any) => (
        <span className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          getStatusColor(row.status)
        )}>
          {row.status === 'PENDING' ? 'Pendiente' : 
           row.status === 'APPROVED' ? 'Aprobada' : 
           row.status === 'PAID' ? 'Pagada' : 'Mixto'}
        </span>
      ),
    },
      ];

  const actions = [
    {
      label: 'Ver detalles',
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: any) => {
        console.log('DEBUG: Comisión seleccionada en frontend - OBJETO COMPLETO:', row);
        console.log('DEBUG: Comisión seleccionada en frontend - PROPIEDADES:', {
          id: row.id,
          employeeName: row.employeeName,
          totalAmount: row.totalAmount,
          totalSales: row.totalSales,
          typeofTotalAmount: typeof row.totalAmount,
          sales: row.sales?.length || 0,
          // Verificar si hay otras propiedades
          allKeys: Object.keys(row),
          // Verificar propiedades específicas que podrían existir
          userName: row.userName,
          userUnit: row.userUnit,
          commissionCount: row.commissionCount
        });
        setSelectedCommission(row);
        setViewModal(true);
      },
      className: 'text-blue-600 hover:bg-blue-50',
    },
    {
      label: 'Liquidar',
      icon: <DollarSign className="h-4 w-4" />,
      onClick: (row: any) => {
        if (row.status === 'PENDING') {
          setPayingId(row.id);
        }
      },
      className: 'text-emerald-600 hover:bg-emerald-50',
      disabled: (row: any) => row.status !== 'PENDING',
    },
    {
      label: 'Recalcular',
      icon: <RefreshCw className="h-4 w-4" />,
      onClick: (row: any) => {
        setRecalculatingId(row.id);
        recalculateMutation.mutate(row.id);
      },
      className: 'text-amber-600 hover:bg-amber-50',
      disabled: (row: any) => row.status === 'PAID' || recalculateMutation.isPending,
    },
    {
      label: 'Anular',
      icon: <X className="h-4 w-4" />,
      onClick: (row: any) => {
        if (confirm('¿Estás seguro de anular todas las comisiones de este día? Esta acción no se puede deshacer.')) {
          // Void all commissions in this group
          row.commissions.forEach((commission: Commission) => {
            voidMutation.mutate(commission.id);
          });
        }
      },
      className: 'text-red-600 hover:bg-red-50',
      disabled: (row: any) => row.status === 'PAID',
    },
  ];

  const filters = [
    {
      key: 'status',
      label: 'Estado',
      type: 'select' as const,
      options: [
        { label: 'Todos', value: '' },
        { label: 'Pendientes', value: 'PENDING' },
        { label: 'Aprobadas', value: 'APPROVED' },
        { label: 'Pagadas', value: 'PAID' },
      ],
    },
    {
      key: 'amountRange',
      label: 'Rango de Monto',
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
      key: 'hasSale',
      label: 'Con venta asociada',
      type: 'checkbox' as const,
    },
    {
      key: 'isPaid',
      label: 'Ya pagadas',
      type: 'checkbox' as const,
    },
    {
      key: 'hasPaymentMethod',
      label: 'Con método de pago',
      type: 'checkbox' as const,
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
        {/* Enhanced Header - Exacto estilo ServicesPage */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-4">
              <div className="h-2 w-2 rounded-full bg-[var(--unit-accent)] animate-pulse"></div>
              <span className="text-sm font-medium text-[var(--unit-text)]">
                Administración
              </span>
            </div>
            <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">Todas las Comisiones</h1>
            <p className="text-[var(--unit-text-muted)]">
              Gestiona las comisiones de todos los empleados
            </p>
          </div>

          {/* Commissions Metrics */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-[var(--unit-accent)]" />
              <span className="ml-2 text-[var(--unit-text)]">Cargando métricas...</span>
            </div>
          ) : (
            <CommissionsMetrics commissions={commissionsResponse?.data || []} />
          )}

          {/* Enhanced Action Buttons - Exacto estilo ServicesPage */}
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
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold shadow-lg border-2 border-red-600/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Download className="h-5 w-5" />
              {exportPDFMutation.isPending ? 'Exportando...' : 'Exportar PDF'}
            </button>
            <Link href="/commissions" className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white font-bold shadow-lg border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
              <DollarSign className="h-5 w-5" />
              Mis Comisiones
            </Link>
          </div>
        </div>

        {/* Search Bar - Always Visible */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
              <Search className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar por empleado, número de venta o notas..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)] text-[var(--unit-text)] placeholder-[var(--unit-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
              />
            </div>
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--unit-text-muted)] hover:text-[var(--unit-text)] rounded-xl border-2 border-[var(--unit-border)]/30 hover:border-[var(--unit-border)]/50 transition-all"
              >
                <X className="h-4 w-4" />
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Enhanced Commissions Filters - Exacto estilo ServicesPage */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6 mb-8">
          {/* Filter Header */}
          <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Filtros de Comisiones</h3>
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
              {/* Date Range Filter - Sin filtro de unidad (usar Header) */}
              <DateRangeFilter
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={(date: Date | null) => date && setDateFrom(date)}
                onDateToChange={(date: Date | null) => date && setDateTo(date)}
                status={statusFilter}
                onStatusChange={setStatusFilter}
                showUnitFilter={false}
                showStatusFilter={true}
                className="rounded-xl"
              />

              {/* Enhanced Active Filters Summary */}
              {(activeUnit || statusFilter || searchFilter) && (
                <div className="rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Filtros activos:</span>
                      <div className="flex flex-wrap gap-2">
                        {activeUnit && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                            Unidad: {activeUnit}
                          </span>
                        )}
                        {statusFilter && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 border border-purple-200">
                            Estado: {statusFilter === 'PENDING' ? 'Pendientes' : statusFilter === 'PAID' ? 'Pagadas' : 'Anuladas'}
                          </span>
                        )}
                        {searchFilter && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-200">
                            Búsqueda: "{searchFilter}"
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setStatusFilter('');
                        setSearchFilter('');
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

        {/* Commissions Table - Exacto estilo ServicesPage */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6">
          {/* Table Header */}
          <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Lista de Comisiones</h3>
                  <p className="text-sm text-[var(--unit-text-muted)]">Gestiona todas las comisiones</p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-[var(--unit-accent)]/20 px-3 py-1.5 text-sm font-bold text-[var(--unit-accent)] border border-[var(--unit-accent)]/30 shadow-sm">
                {groupedCommissions?.length || 0} grupos
              </span>
            </div>
          </div>

          {/* Table */}
          <DataTable
            columns={columns}
            data={groupedCommissions ?? []}
            keyExtractor={(row) => row.id}
            loading={isLoading}
            searchPlaceholder="" // Hidden since we have custom search
            filters={[]} // Hidden since we have custom filters
            actions={actions}
            emptyMessage="No se encontraron comisiones con los filtros aplicados."
            pageSize={15}
            pageSizeOptions={[10, 15, 30, 50]}
          />
        </div>

        {/* Payment Modal - Estilo Eliminar Gasto */}
        {payingId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPayingId(null);
              setPaymentMethod('');
              setPaymentNotes('');
            }
          }}>
            <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-50/95 to-emerald-100/85 backdrop-blur-md shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              {/* Background Pattern - Estilo Eliminar Gasto */}
              <div className="absolute inset-0 opacity-30 pointer-events-none">
                <div className="h-full w-full bg-repeat" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
              </div>

              {/* Header - Estilo Eliminar Gasto */}
              <div className="relative flex items-center gap-4 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-emerald-900">Liquidar Comisión</h3>
                  <p className="text-sm text-emerald-700">Esta acción registrará el pago</p>
                </div>
              </div>

              {/* Content - Estilo Eliminar Gasto */}
              <div className="relative space-y-4">
                <div className="rounded-xl border-2 border-emerald-200/50 bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 shadow-lg mt-1">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-emerald-900">
                        ¿Estás seguro de que deseas liquidar la comisión?
                      </p>
                      <p className="text-sm text-emerald-700 mt-1">
                        Esta acción registrará el pago de la comisión y no se puede deshacer.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Commission Group Info - Estilo Eliminar Gasto */}
                <div className="rounded-xl border-2 border-emerald-200/30 bg-gradient-to-br from-white/50 to-white/30 p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Empleado</span>
                      <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                        {groupedCommissions?.find(c => c.id === payingId)?.employeeName || 'Empleado'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Comisiones</span>
                      <span className="text-sm font-bold text-gray-900">
                        {groupedCommissions?.find(c => c.id === payingId)?.commissions?.length || 0} comisiones
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Monto Total</span>
                      <span className="text-sm font-bold text-gray-900">
                        S/ {(groupedCommissions?.find(c => c.id === payingId)?.totalAmount || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Fecha</span>
                      <span className="text-sm font-medium text-gray-900">
                        {groupedCommissions?.find(c => c.id === payingId) ? 
                          parseISO(groupedCommissions.find(c => c.id === payingId)!.date).toLocaleDateString() : 
                          parseISO(new Date().toISOString()).toLocaleDateString()
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--unit-text)]">
                    Método de pago
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-[var(--unit-border-radius)] border bg-[var(--unit-surface)] px-3 py-2 text-sm text-[var(--unit-text)]"
                    style={{ borderColor: 'var(--unit-border)' }}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Yape">Yape</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--unit-text)]">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Ej: Pago quincenal, bonificación especial, etc."
                    className="w-full rounded-[var(--unit-border-radius)] border bg-[var(--unit-surface)] px-3 py-2 text-sm text-[var(--unit-text)]"
                    style={{ borderColor: 'var(--unit-border)' }}
                    rows={3}
                  />
                </div>
              </div>

              {/* Actions - Estilo Eliminar Gasto */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => markPaidMutation.mutate({ groupId: payingId, method: paymentMethod, notes: paymentNotes })}
                  disabled={markPaidMutation.isPending || !paymentMethod.trim()}
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold shadow-lg border-2 border-emerald-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                  {markPaidMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                      Liquidando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Liquidar Comisión
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setPayingId(null);
                    setPaymentMethod('');
                    setPaymentNotes('');
                  }}
                  disabled={markPaidMutation.isPending}
                  className="flex-1 rounded-xl border-2 border-emerald-300/50 px-6 py-3 text-sm font-medium text-emerald-700 bg-white/80 hover:bg-emerald-50 transition-all hover:shadow-lg active:scale-[0.98]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Details Modal - Premium Glassmorphism */}
        {viewModal && selectedCommission && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="h-full w-full bg-repeat" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
              </div>
              
              <div className="relative">
                {/* Enhanced Header - Exacto estilo ServicesPage */}
                <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-8 -mt-8 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                        <Eye className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[var(--unit-text)]">Detalles de Comisiones Agrupadas</h3>
                        <p className="text-sm text-[var(--unit-text-muted)]">
                          {selectedCommission.userName} - {format(parseISO(selectedCommission.date), 'd MMM yyyy', { locale: es })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setViewModal(false)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-[var(--unit-border)]/30 bg-[var(--unit-surface)] hover:bg-[var(--unit-surface-elevated)] transition-all group"
                    >
                      <X className="h-4 w-4 text-[var(--unit-text-muted)] group-hover:text-[var(--unit-accent)] transition-colors" />
                    </button>
                  </div>
                </div>

                {/* Enhanced Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Enhanced Group Information - Glassmorphism Card */}
                  <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                    <div className="relative">
                      {/* Card Header */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                          <User className="h-4 w-4 text-[var(--unit-accent)]" />
                        </div>
                        <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Resumen del Día</h4>
                      </div>

                      {/* Enhanced Stats List */}
                      <div className="space-y-4">
                        {/* Employee */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Empleado</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                            {selectedCommission.userName}
                          </span>
                        </div>

                        {/* Unit */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Unidad</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                            {selectedCommission.userUnit || '—'}
                          </span>
                        </div>

                        {/* Date */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Fecha</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                            {format(parseISO(selectedCommission.date), 'd MMM yyyy', { locale: es })}
                          </span>
                        </div>

                        {/* Total Sales */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border-2 border-[var(--unit-primary)]/30 bg-gradient-to-r from-[var(--unit-primary)]/5 to-[var(--unit-accent)]/5 hover:from-[var(--unit-primary)]/10 hover:to-[var(--unit-accent)]/10 transition-all">
                          <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-[var(--unit-primary)]" />
                            <span className="text-sm font-bold text-[var(--unit-primary)]">Total de Ventas</span>
                          </div>
                          <span className="font-bold text-[var(--unit-primary)] bg-white px-3 py-1 rounded-lg border-2 border-[var(--unit-primary)]/30 shadow-lg">
                            {selectedCommission.totalSales}
                          </span>
                        </div>

                        {/* Total Commission */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 transition-all">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm font-bold text-emerald-800">Comisión Total</span>
                          </div>
                          <span className="font-bold text-emerald-800 bg-white px-3 py-1 rounded-lg border-2 border-emerald-300/30 shadow-lg">
                            S/ {selectedCommission.totalAmount.toFixed(2)}
                          </span>
                        </div>

                        {/* Status */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Estado</span>
                          </div>
                          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold border ${
                            selectedCommission.status === 'PAID' 
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                              : selectedCommission.status === 'APPROVED'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : selectedCommission.status === 'PENDING'
                              ? 'bg-gray-100 text-gray-800 border-gray-200'
                              : 'bg-orange-100 text-orange-800 border-orange-200'
                          }`}>
                            {getStatusIcon(selectedCommission.status)}
                            {selectedCommission.status === 'PENDING' ? 'Pendiente' : 
                             selectedCommission.status === 'APPROVED' ? 'Aprobada' : 
                             selectedCommission.status === 'PAID' ? 'Pagada' : 'Mixto'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Individual Commissions List - Glassmorphism Card */}
                  <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                    <div className="relative">
                      {/* Card Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                            <Receipt className="h-4 w-4 text-[var(--unit-accent)]" />
                          </div>
                          <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">
                            Ventas Individuales
                          </h4>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-[var(--unit-accent)]/20 px-3 py-1.5 text-xs font-bold text-[var(--unit-accent)] border border-[var(--unit-accent)]/30 shadow-sm">
                          {(selectedCommission.sales || []).length} ventas
                        </span>
                      </div>

                      {/* Enhanced Commissions List */}
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {(selectedCommission.sales || []).map((item: any, index: number) => (
                          <div key={item.id || index} className="group/commission relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/20 bg-gradient-to-br from-white to-[var(--unit-surface)] p-4 hover:border-[var(--unit-accent)]/30 hover:shadow-lg transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover/commission:opacity-100 transition-opacity rounded-xl"></div>
                            <div className="relative">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Receipt className="h-4 w-4 text-[var(--unit-text-muted)]" />
                                    <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-2 py-1 rounded-lg border border-[var(--unit-border)]/30">
                                      Venta #{item.saleNumber || 'N/A'}
                                    </span>
                                    {/* Mostrar tipo de venta si está disponible */}
                                    {item.itemType && (
                                      <span className={cn(
                                        'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                                        item.itemType === 'PRODUCT' 
                                          ? 'bg-blue-100 text-blue-800' 
                                          : item.itemType === 'SERVICE'
                                          ? 'bg-purple-100 text-purple-800'
                                          : 'bg-green-100 text-green-800'
                                      )}>
                                        {item.itemType === 'PRODUCT' ? 'Producto' : 
                                         item.itemType === 'SERVICE' ? 'Servicio' : 'Paquete'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-[var(--unit-text-muted)]">
                                    <Clock className="h-3 w-3" />
                                    <span>{format(parseISO(item.createdAt || selectedCommission.date), 'HH:mm', { locale: es })}</span>
                                  </div>
                                  {/* Mostrar nombre del item si está disponible */}
                                  {item.itemName && (
                                    <div className="mt-1 text-sm text-[var(--unit-text)]">
                                      {item.itemName}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="flex items-center gap-1 mb-1">
                                    <DollarSign className="h-3 w-3 text-emerald-600" />
                                    <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                                      S/ {(item.amount || item.totalAmount || 0).toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-[var(--unit-text-muted)]">
                                    <TrendingUp className="h-3 w-3" />
                                    <span>{item.pctApplied || 0}%</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Footer Actions */}
                <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-t border-[var(--unit-border)]/30 -mx-8 -mb-8 mt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                        <DollarSign className="h-4 w-4 text-[var(--unit-accent)]" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--unit-text-muted)]">Total del Día</p>
                        <p className="text-sm font-bold text-[var(--unit-text)]">
                          {selectedCommission.totalSales} ventas • S/ {selectedCommission.totalAmount.toFixed(2)}
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

            {/* Header */}
            <div className="relative flex items-center gap-4 mb-6">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${exportType === 'excel' ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'} shadow-lg`}>
                <Download className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--unit-text)]">Exportar a {exportType === 'excel' ? 'Excel' : 'PDF'}</h3>
                <p className="text-sm text-[var(--unit-text-muted)]">Configura tu reporte personalizado</p>
              </div>
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
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="filterByEmployee"
                      checked={exportConfig.filterByEmployee}
                      onChange={(e) => setExportConfig((prev: any) => ({ ...prev, filterByEmployee: e.target.checked, selectedEmployee: e.target.checked ? prev.selectedEmployee : '' }))}
                      className={`h-4 w-4 ${exportType === 'excel' ? 'text-green-600 border-green-300/50 focus:ring-green-500/50' : 'text-red-600 border-red-300/50 focus:ring-red-500/50'} rounded`}
                    />
                    <label htmlFor="filterByEmployee" className="text-sm font-medium text-[var(--unit-text)]">
                      Filtrar por empleado específico
                    </label>
                  </div>
                  {exportConfig.filterByEmployee && (
                    <div className="ml-7">
                      <label className="block text-xs font-medium text-[var(--unit-text-muted)] mb-1">
                        Seleccionar empleado
                      </label>
                      <select
                        value={exportConfig.selectedEmployee}
                        onChange={(e) => setExportConfig((prev: any) => ({ ...prev, selectedEmployee: e.target.value }))}
                        className={`w-full rounded-lg border ${exportType === 'excel' ? 'border-green-300/50 focus:ring-green-500/50 focus:border-green-500' : 'border-red-300/50 focus:ring-red-500/50 focus:border-red-500'} bg-white px-3 py-2 text-sm text-[var(--unit-text)] focus:outline-none focus:ring-2 transition-all`}
                      >
                        <option value="">Todos los empleados</option>
                        {uniqueEmployees.map(employee => (
                          <option key={employee} value={employee}>
                            {employee}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="filterByPaymentMethod"
                      checked={exportConfig.filterByPaymentMethod}
                      onChange={(e) => setExportConfig((prev: any) => ({ ...prev, filterByPaymentMethod: e.target.checked }))}
                      className={`h-4 w-4 ${exportType === 'excel' ? 'text-green-600 border-green-300/50 focus:ring-green-500/50' : 'text-red-600 border-red-300/50 focus:ring-red-500/50'} rounded`}
                    />
                    <label htmlFor="filterByPaymentMethod" className="text-sm font-medium text-[var(--unit-text)]">
                      Filtrar por método de pago
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
                      {exportConfig.dateFrom.toLocaleDateString('es-ES')} - {exportConfig.dateTo.toLocaleDateString('es-ES')}
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
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--unit-text-muted)]">Filtro Empleado</span>
                    <span className="text-sm font-medium text-[var(--unit-text)]">
                      {exportConfig.filterByEmployee ? (exportConfig.selectedEmployee || 'Todos') : 'No aplicado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--unit-text-muted)]">Filtro Pago</span>
                    <span className="text-sm font-medium text-[var(--unit-text)]">
                      {exportConfig.filterByPaymentMethod ? 'Activado' : 'No aplicado'}
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
    </div>
  );
}


