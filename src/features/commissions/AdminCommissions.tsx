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
import { TableToolbar, type QuickChip } from '@/components/ui/TableToolbar';
import { TableBadge } from '@/components/ui/TableBadge';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { CommissionsMetrics } from './CommissionsMetrics';
import { cn } from '@/lib/utils';
import { downloadExcelReport } from '@/lib/excelReport';
import { downloadPdfReport } from '@/lib/pdfReport';
import type { Commission, GroupedCommission, GroupedCommissionsResponse, CommissionStatus } from '@/types/commission';

export function AdminCommissions(): JSX.Element {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const activeUnit = useUnitStore((s) => s.activeUnit);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<Date>(startOfDay(new Date('2020-01-01'))); // Fecha muy lejana para mostrar todas
  const [dateTo, setDateTo] = useState<Date>(endOfDay(new Date('2100-12-31'))); // Fecha muy futura para mostrar todas
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
    queryFn: async (): Promise<GroupedCommissionsResponse> => {
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

  // Export Excel mutation - Profesional con downloadExcelReport
  const exportExcelMutation = useMutation({
    mutationFn: async () => {
      const filteredCommissions = commissions.filter(c => {
        const commissionDate = parseISO(c.createdAt);
        const unitMatch = exportConfig.unit === 'ALL' || c.user.unit === exportConfig.unit;
        const dateMatch = commissionDate >= exportConfig.dateFrom && commissionDate <= exportConfig.dateTo;
        const employeeMatch = !exportConfig.filterByEmployee || !exportConfig.selectedEmployee || (c.user?.name === exportConfig.selectedEmployee || c.employeeName === exportConfig.selectedEmployee);
        const paymentMethodMatch = !exportConfig.filterByPaymentMethod || !exportConfig.selectedPaymentMethod || c.paymentMethod === exportConfig.selectedPaymentMethod;
        return unitMatch && dateMatch && employeeMatch && paymentMethodMatch;
      });

      const headers = ['ID', 'Empleado', 'Unidad', 'Estado', 'ID Venta', 'Fecha Creación', 'Monto Comisión (S/)', '% Comisión', 'Fecha Pago', 'Método Pago', 'Notas'];
      const rows = filteredCommissions.map((c: any) => {
        const createdDate = parseISO(c.createdAt);
        const formattedDate = format(createdDate, 'dd/MM/yyyy');
        const paymentDate = c.paidAt ? format(parseISO(c.paidAt), 'dd/MM/yyyy') : '—';
        const commissionPercentage = c.totalAmount && c.sale ? 
          ((c.totalAmount / c.sale.total) * 100).toFixed(2) + '%' : '0.00%';

        return [
          c.id,
          c.employeeName || c.userName || c.user?.name || '',
          (c.employeeUnit || c.userUnit || c.user?.unit) === 'BARBERIA' ? 'Barbería' : 'SPA',
          c.status === 'PENDING' ? 'Pendiente' : c.status === 'APPROVED' ? 'Aprobada' : c.status === 'PAID' ? 'Pagada' : c.status,
          c.saleId || c.sale?.id || '—',
          formattedDate,
          Number(c.totalAmount || c.amount || 0).toFixed(2),
          commissionPercentage,
          paymentDate,
          c.paymentMethod || '—',
          c.paymentNotes || c.notes || ''
        ];
      });

      const totalAmount = filteredCommissions.reduce((sum, c: any) => sum + Number(c.totalAmount || c.amount || 0), 0);
      const unitName = exportConfig.unit === 'ALL' ? 'Todas las unidades' : exportConfig.unit === 'SPA' ? 'SPA' : 'Barbería';

      await downloadExcelReport(
        `reporte_comisiones_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
        'Comisiones',
        headers,
        rows,
        {
          unit: exportConfig.unit === 'ALL' ? 'General' : exportConfig.unit,
          reportTitle: `REPORTE DE COMISIONES - ${unitName.toUpperCase()}`,
          periodInfo: { from: exportConfig.dateFrom, to: exportConfig.dateTo },
          totalAmount,
          filterInfo: `Filtros: ${unitName} | ${filteredCommissions.length} registros`
        }
      );
    },
    onSuccess: () => {
      addToast('Reporte de comisiones exportado a Excel exitosamente', 'success');
      setShowExportModal(false);
    },
    onError: () => {
      addToast('Error al exportar comisiones a Excel', 'error');
    },
  });

  // Export PDF mutation - Profesional con downloadPdfReport
  const exportPDFMutation = useMutation({
    mutationFn: async () => {
      const filteredCommissions = commissions.filter(c => {
        const commissionDate = parseISO(c.createdAt);
        const unitMatch = exportConfig.unit === 'ALL' || c.user.unit === exportConfig.unit;
        const dateMatch = commissionDate >= exportConfig.dateFrom && commissionDate <= exportConfig.dateTo;
        const employeeMatch = !exportConfig.filterByEmployee || !exportConfig.selectedEmployee || (c.user?.name === exportConfig.selectedEmployee || c.employeeName === exportConfig.selectedEmployee);
        const paymentMethodMatch = !exportConfig.filterByPaymentMethod || !exportConfig.selectedPaymentMethod || c.paymentMethod === exportConfig.selectedPaymentMethod;
        return unitMatch && dateMatch && employeeMatch && paymentMethodMatch;
      });

      const headers = ['ID', 'Empleado', 'Unidad', 'Fecha', 'Venta ID', 'Estado', 'Monto Comisión (S/)'];
      const rows = filteredCommissions.map((c: any) => {
        const createdDate = parseISO(c.createdAt);
        const formattedDate = format(createdDate, 'dd/MM/yyyy');
        return [
          c.id,
          c.employeeName || c.userName || c.user?.name || '',
          (c.employeeUnit || c.userUnit || c.user?.unit) === 'BARBERIA' ? 'Barbería' : 'SPA',
          formattedDate,
          c.saleId || c.sale?.id || '—',
          c.status === 'PENDING' ? 'Pendiente' : c.status === 'APPROVED' ? 'Aprobada' : c.status === 'PAID' ? 'Pagada' : c.status,
          Number(c.totalAmount || c.amount || 0).toFixed(2)
        ];
      });

      const totalAmount = filteredCommissions.reduce((sum, c: any) => sum + Number(c.totalAmount || c.amount || 0), 0);
      const unitName = exportConfig.unit === 'ALL' ? 'Todas las unidades' : exportConfig.unit === 'SPA' ? 'SPA' : 'Barbería';

      downloadPdfReport(
        `reporte_comisiones_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
        'REPORTE DE COMISIONES',
        unitName,
        headers,
        rows,
        {
          unit: exportConfig.unit === 'ALL' ? 'General' : exportConfig.unit,
          periodInfo: { from: exportConfig.dateFrom, to: exportConfig.dateTo },
          totals: {
            label: 'TOTAL COMISIONES:',
            amount: totalAmount,
            currency: 'S/'
          },
          filterInfo: `Unidad: ${unitName} | ${filteredCommissions.length} registros`
        }
      );

      addToast('PDF de comisiones exportado exitosamente', 'success');
      setShowExportModal(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
    },
    onError: () => {
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
      default: return 'bg-gray-100 text-[var(--unit-text)]';
    }
  };

  const columns = [
    {
      key: 'employee',
      header: 'Empleado',
      sortable: true,
      align: 'left' as const,
      render: (row: any) => (
        <span className="font-semibold text-[var(--unit-text)]">
          {row.employeeName || row.userName}
        </span>
      ),
    },
    {
      key: 'unit',
      header: 'Unidad',
      sortable: true,
      align: 'center' as const,
      render: (row: any) => {
        const unit = (row.employeeUnit || row.userUnit) === 'BARBERIA' ? 'barberia' : 'spa';
        return (
          <TableBadge type={unit === 'barberia' ? 'unit-barberia' : 'unit-spa'}>
            {unit === 'barberia' ? 'Barbería' : 'SPA'}
          </TableBadge>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Fecha',
      sortable: true,
      align: 'left' as const,
      render: (row: any) => {
        const commissionDate = row.date ? parseISO(row.date) : parseISO(row.createdAt);
        const today = new Date();
        const isToday = commissionDate.toDateString() === today.toDateString();
        
        return (
          <div className="flex flex-col gap-1">
            <span className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium w-fit',
              isToday 
                ? 'bg-emerald-100 text-emerald-800 font-semibold' 
                : 'bg-indigo-100 text-indigo-800'
            )}>
              {format(commissionDate, 'd MMM yyyy', { locale: es })}
              {isToday && ' (Hoy)'}
            </span>
            <span className="text-[11px] text-[var(--unit-text-muted)]">
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
      align: 'center' as const,
      render: (row: any) => (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold bg-blue-100 text-blue-800">
          {row.totalSales || row.commissionCount || 1}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Comisión Total',
      sortable: true,
      align: 'right' as const,
      render: (row: any) => (
        <TableBadge type="amount" bold mono>
          S/ {(row.totalAmount || 0).toFixed(2)}
        </TableBadge>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      align: 'center' as const,
      render: (row: any) => {
        const statusType = 
          row.status === 'PAID' ? 'status-paid' :
          row.status === 'APPROVED' ? 'status-active' :
          row.status === 'PENDING' ? 'status-pending' : 'status-neutral';
        return (
          <TableBadge type={statusType}>
            {row.status === 'PENDING' ? 'Pendiente' : 
             row.status === 'APPROVED' ? 'Aprobada' : 
             row.status === 'PAID' ? 'Pagada' : 'Mixto'}
          </TableBadge>
        );
      },
    },
  ];

  const actions = [
    {
      label: 'Ver detalles',
      variant: 'view' as const,
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: any) => {
        setSelectedCommission(row);
        setViewModal(true);
      },
    },
    {
      label: 'Liquidar',
      variant: 'success' as const,
      icon: <DollarSign className="h-4 w-4" />,
      onClick: (row: any) => {
        if (row.status === 'PENDING') {
          setPayingId(row.id);
        }
      },
      disabled: (row: any) => row.status !== 'PENDING',
    },
    {
      label: 'Recalcular',
      variant: 'refresh' as const,
      icon: <RefreshCw className="h-4 w-4" />,
      onClick: (row: any) => {
        setRecalculatingId(row.id);
        recalculateMutation.mutate(row.id);
      },
      disabled: (row: any) => row.status === 'PAID' || recalculateMutation.isPending,
    },
    {
      label: 'Anular',
      variant: 'delete' as const,
      icon: <X className="h-4 w-4" />,
      onClick: (row: any) => {
        if (confirm('¿Estás seguro de anular todas las comisiones de este día? Esta acción no se puede deshacer.')) {
          // Void all commissions in this group
          row.commissions?.forEach((commission: Commission) => {
            voidMutation.mutate(commission.id);
          });
        }
      },
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
    <div className="min-h-screen bg-[var(--unit-surface)]">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Top Header & Fast Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--unit-border)]/40 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] text-xs font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--unit-accent)] animate-pulse" />
                Liquidación de Personal • {activeUnit === 'BARBERIA' ? 'Barbería' : 'SPA'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--unit-text)] tracking-tight">
              Control General de Comisiones
            </h1>
            <p className="text-xs sm:text-sm text-[var(--unit-text-muted)]">
              Auditoría de comisiones por especialista, liquidaciones de turno y exportación contable
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['commissions'] })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-xs font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-all shadow-unit-sm"
              title="Actualizar datos"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin text-[var(--unit-accent)]")} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-xs font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-all shadow-unit-sm"
            >
              <Download className="h-4 w-4 text-[var(--unit-accent)]" />
              <span>Exportar</span>
            </button>

            <Link 
              href="/commissions" 
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-unit bg-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/90 text-white text-xs font-bold transition-all shadow-unit active:scale-[0.98]"
            >
              <DollarSign className="h-4 w-4" />
              Mis Comisiones
            </Link>
          </div>
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

        {/* Unified TableToolbar */}
        <TableToolbar
          search={searchFilter}
          onSearchChange={setSearchFilter}
          searchPlaceholder="Buscar por empleado, número de venta o notas..."
          chips={[
            { id: '', label: 'Todas', count: commissions.length },
            { id: 'PENDING', label: 'Pendientes', count: pending.length, activeColor: 'bg-amber-500 text-white' },
            { id: 'APPROVED', label: 'Aprobadas', count: approved.length, activeColor: 'bg-indigo-600 text-white' },
            { id: 'PAID', label: 'Pagadas', count: paid.length, activeColor: 'bg-emerald-600 text-white' },
          ]}
          activeChip={statusFilter}
          onChipChange={(id) => setStatusFilter(String(id))}
          showAdvancedFiltersButton={true}
          isAdvancedOpen={showFilters}
          onToggleAdvanced={() => setShowFilters(!showFilters)}
          activeFiltersCount={(statusFilter ? 1 : 0) + (searchFilter ? 1 : 0) + (activeUnit ? 1 : 0)}
          onResetFilters={() => {
            setStatusFilter('');
            setSearchFilter('');
            setDateFrom(startOfDay(subDays(new Date(), 30)));
            setDateTo(endOfDay(new Date()));
          }}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setExportType('excel');
                  setShowExportModal(true);
                }}
                disabled={exportExcelMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-unit bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Excel</span>
              </button>
              <button
                onClick={() => {
                  setExportType('pdf');
                  setShowExportModal(true);
                }}
                disabled={exportPDFMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-unit bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                <span>PDF</span>
              </button>
            </div>
          }
          advancedFiltersContent={
            <DateRangeFilter
              compact={true}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={(date: Date | null) => date && setDateFrom(date)}
              onDateToChange={(date: Date | null) => date && setDateTo(date)}
              status={statusFilter}
              onStatusChange={setStatusFilter}
              showUnitFilter={false}
              showStatusFilter={true}
            />
          }
        />

        {/* DataTable Container */}
        <div className="mt-4">
          <DataTable
            columns={columns}
            data={groupedCommissions ?? []}
            keyExtractor={(row) => row.id}
            loading={isLoading}
            actions={actions}
            emptyMessage="No se encontraron comisiones con los filtros aplicados."
            pageSize={15}
            pageSizeOptions={[10, 15, 30, 50]}
            onResetFilters={() => {
              setStatusFilter('');
              setSearchFilter('');
            }}
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
            <div className="relative overflow-hidden rounded-unit-lg border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-50/95 to-emerald-100/85 backdrop-blur-md shadow-unit-lg p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              {/* Background Pattern - Estilo Eliminar Gasto */}
              <div className="absolute inset-0 opacity-30 pointer-events-none">
                <div className="h-full w-full bg-repeat" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
              </div>

              {/* Header - Estilo Eliminar Gasto */}
              <div className="relative flex items-center gap-4 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-unit bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-unit">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-emerald-900">Liquidar Comisión</h3>
                  <p className="text-sm text-emerald-700">Esta acción registrará el pago</p>
                </div>
              </div>

              {/* Content - Estilo Eliminar Gasto */}
              <div className="relative space-y-4">
                <div className="rounded-unit border-2 border-emerald-200/50 bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-unit bg-emerald-500 shadow-unit mt-1">
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
                <div className="rounded-unit border-2 border-emerald-200/30 bg-gradient-to-br from-white/50 to-white/30 p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[var(--unit-text-muted)] uppercase tracking-wider">Empleado</span>
                      <span className="text-sm font-medium text-[var(--unit-text)] truncate max-w-[200px]">
                        {groupedCommissions?.find(c => c.id === payingId)?.employeeName || 'Empleado'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[var(--unit-text-muted)] uppercase tracking-wider">Comisiones</span>
                      <span className="text-sm font-bold text-[var(--unit-text)]">
                        {groupedCommissions?.find(c => c.id === payingId)?.commissions?.length || 0} comisiones
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[var(--unit-text-muted)] uppercase tracking-wider">Monto Total</span>
                      <span className="text-sm font-bold text-[var(--unit-text)]">
                        S/ {(groupedCommissions?.find(c => c.id === payingId)?.totalAmount || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[var(--unit-text-muted)] uppercase tracking-wider">Fecha</span>
                      <span className="text-sm font-medium text-[var(--unit-text)]">
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
                  className="flex-1 rounded-unit bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold shadow-unit border-2 border-emerald-500/50 transition-all hover:shadow-unit-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
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
                  className="flex-1 rounded-unit border-2 border-emerald-300/50 px-6 py-3 text-sm font-medium text-emerald-700 bg-white/80 hover:bg-emerald-50 transition-all hover:shadow-unit active:scale-[0.98]"
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
            <div className="relative overflow-hidden rounded-unit-lg border border-[var(--unit-border)]/60 bg-[var(--unit-surface)] shadow-unit-lg p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="h-full w-full bg-repeat" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
              </div>
              
              <div className="relative">
                {/* Enhanced Header */}
                <div className="bg-[var(--unit-surface-elevated)] px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-8 -mt-8 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-unit bg-[var(--unit-accent)] text-white shadow-unit">
                        <Eye className="h-5 w-5" />
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
                      className="flex h-8 w-8 items-center justify-center rounded-unit border border-[var(--unit-border)]/50 bg-[var(--unit-surface)] hover:bg-[var(--unit-surface-elevated)] transition-all"
                    >
                      <X className="h-4 w-4 text-[var(--unit-text-muted)] hover:text-[var(--unit-accent)] transition-colors" />
                    </button>
                  </div>
                </div>

                {/* Enhanced Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Enhanced Group Information */}
                  <div className="relative overflow-hidden rounded-unit border border-[var(--unit-border)]/50 bg-[var(--unit-surface)] p-6 shadow-unit-sm">
                    <div className="relative">
                      {/* Card Header */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-8 w-8 items-center justify-center rounded-unit bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] border border-[var(--unit-accent)]/20">
                          <User className="h-4 w-4" />
                        </div>
                        <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Resumen del Día</h4>
                      </div>

                      {/* Enhanced Stats List */}
                      <div className="space-y-4">
                        {/* Employee */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-unit border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Empleado</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-unit border border-[var(--unit-border)]/30">
                            {selectedCommission.userName}
                          </span>
                        </div>

                        {/* Unit */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-unit border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Unidad</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-unit border border-[var(--unit-border)]/30">
                            {selectedCommission.userUnit || '—'}
                          </span>
                        </div>

                        {/* Date */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-unit border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Fecha</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-unit border border-[var(--unit-border)]/30">
                            {format(parseISO(selectedCommission.date), 'd MMM yyyy', { locale: es })}
                          </span>
                        </div>

                        {/* Total Sales */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-unit border border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 transition-all">
                          <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-bold text-blue-800 dark:text-blue-300">Total de Ventas</span>
                          </div>
                          <span className="font-bold text-blue-800 dark:text-blue-200 bg-[var(--unit-surface-elevated)] dark:bg-blue-950/80 px-3 py-1 rounded-unit border border-blue-300/40 shadow-unit-sm">
                            {selectedCommission.totalSales}
                          </span>
                        </div>

                        {/* Total Commission */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-unit border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 transition-all">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Comisión Total</span>
                          </div>
                          <span className="font-bold text-emerald-800 dark:text-emerald-200 bg-[var(--unit-surface-elevated)] dark:bg-emerald-950/80 px-3 py-1 rounded-unit border border-emerald-300/40 shadow-unit-sm">
                            S/ {selectedCommission.totalAmount.toFixed(2)}
                          </span>
                        </div>

                        {/* Status */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-unit border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Estado</span>
                          </div>
                          <TableBadge type={
                            selectedCommission.status === 'PAID' ? 'status-paid' :
                            selectedCommission.status === 'APPROVED' ? 'status-active' :
                            selectedCommission.status === 'PENDING' ? 'status-pending' : 'status-neutral'
                          }>
                            {getStatusIcon(selectedCommission.status)}
                            <span className="ml-1">
                              {selectedCommission.status === 'PENDING' ? 'Pendiente' : 
                               selectedCommission.status === 'APPROVED' ? 'Aprobada' : 
                               selectedCommission.status === 'PAID' ? 'Pagada' : 'Mixto'}
                            </span>
                          </TableBadge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Individual Commissions List */}
                  <div className="relative overflow-hidden rounded-unit border border-[var(--unit-border)]/50 bg-[var(--unit-surface)] p-6 shadow-unit-sm">
                    <div className="relative">
                      {/* Card Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-unit bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] border border-[var(--unit-accent)]/20">
                            <Receipt className="h-4 w-4" />
                          </div>
                          <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">
                            Ventas Individuales
                          </h4>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-[var(--unit-accent)]/15 px-3 py-1.5 text-xs font-bold text-[var(--unit-accent)] border border-[var(--unit-accent)]/30 shadow-unit-sm">
                          {(selectedCommission.sales || []).length} ventas
                        </span>
                      </div>

                      {/* Enhanced Commissions List */}
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {(selectedCommission.sales || []).map((item: any, index: number) => (
                          <div key={item.id || index} className="group/commission relative overflow-hidden rounded-unit border border-[var(--unit-border)]/30 bg-[var(--unit-surface-elevated)] p-4 hover:border-[var(--unit-accent)]/30 hover:shadow-unit transition-all">
                            <div className="relative">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Receipt className="h-4 w-4 text-[var(--unit-text-muted)]" />
                                    <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-2 py-1 rounded-unit border border-[var(--unit-border)]/30">
                                      Venta #{item.saleNumber || 'N/A'}
                                    </span>
                                    {item.itemType && (
                                      <TableBadge type={
                                        item.itemType === 'PRODUCT' ? 'status-active' :
                                        item.itemType === 'SERVICE' ? 'unit-spa' :
                                        'status-paid'
                                      }>
                                        {item.itemType === 'PRODUCT' ? 'Producto' : 
                                         item.itemType === 'SERVICE' ? 'Servicio' : 'Paquete'}
                                      </TableBadge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-[var(--unit-text-muted)]">
                                    <Clock className="h-3 w-3" />
                                    <span>{format(parseISO(item.createdAt || selectedCommission.date), 'HH:mm', { locale: es })}</span>
                                  </div>
                                  {item.itemName && (
                                    <div className="mt-1 text-sm text-[var(--unit-text)]">
                                      {item.itemName}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="flex items-center gap-1 mb-1">
                                    <DollarSign className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                    <span className="font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-1 rounded-unit border border-emerald-200 dark:border-emerald-800">
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
                <div className="bg-[var(--unit-surface-elevated)] px-6 py-4 border-t border-[var(--unit-border)]/30 -mx-8 -mb-8 mt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-unit bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] border border-[var(--unit-accent)]/20">
                        <DollarSign className="h-4 w-4" />
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
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-unit bg-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/90 text-white font-bold shadow-unit transition-all active:scale-[0.98]"
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
          <div className={`relative overflow-hidden rounded-unit-lg border-2 ${exportType === 'excel' ? 'border-green-500/50 bg-gradient-to-br from-green-50/95 to-green-100/85' : 'border-red-500/50 bg-gradient-to-br from-red-50/95 to-red-100/85'} backdrop-blur-md shadow-unit-lg p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <div className="h-full w-full bg-repeat" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${exportType === 'excel' ? '10b981' : 'ef4444'}' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}></div>
            </div>

            {/* Header */}
            <div className="relative flex items-center gap-4 mb-6">
              <div className={`flex h-12 w-12 items-center justify-center rounded-unit bg-gradient-to-br ${exportType === 'excel' ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'} shadow-unit`}>
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
              <div className="rounded-unit border border-[var(--unit-border)]/50 bg-[var(--unit-surface-elevated)] p-4">
                <label className="block text-sm font-medium text-[var(--unit-text)] mb-2">
                  Unidad de Negocio
                </label>
                <select
                  value={exportConfig.unit}
                  onChange={(e) => setExportConfig((prev: any) => ({ ...prev, unit: e.target.value as any }))}
                  className="w-full rounded-unit border border-[var(--unit-border)]/60 bg-[var(--unit-surface)] px-4 py-2.5 text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all cursor-pointer"
                >
                  <option value="ALL">Todas las unidades</option>
                  <option value="SPA">SPA</option>
                  <option value="BARBERIA">Barbería</option>
                </select>
              </div>

              {/* Date Range */}
              <div className="rounded-unit border border-[var(--unit-border)]/50 bg-[var(--unit-surface-elevated)] p-4">
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
                      className="w-full rounded-unit border border-[var(--unit-border)]/50 bg-[var(--unit-surface)] px-3 py-2 text-sm text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
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
                      className="w-full rounded-unit border border-[var(--unit-border)]/50 bg-[var(--unit-surface)] px-3 py-2 text-sm text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Include Logo */}
              <div className="rounded-unit border border-[var(--unit-border)]/50 bg-[var(--unit-surface-elevated)] p-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="includeLogo"
                    checked={exportConfig.includeLogo}
                    onChange={(e) => setExportConfig((prev: any) => ({ ...prev, includeLogo: e.target.checked }))}
                    className="h-4 w-4 text-[var(--unit-accent)] rounded border-[var(--unit-border)]"
                  />
                  <label htmlFor="includeLogo" className="text-sm font-medium text-[var(--unit-text)]">
                    Incluir logo del negocio
                  </label>
                </div>
              </div>

              {/* Additional Options */}
              <div className="rounded-unit border border-[var(--unit-border)]/50 bg-[var(--unit-surface-elevated)] p-4">
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
                      className="h-4 w-4 text-[var(--unit-accent)] rounded border-[var(--unit-border)]"
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
                      className="h-4 w-4 text-[var(--unit-accent)] rounded border-[var(--unit-border)]"
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
                      className="h-4 w-4 text-[var(--unit-accent)] rounded border-[var(--unit-border)]"
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
                        className="w-full rounded-unit border border-[var(--unit-border)]/50 bg-[var(--unit-surface)] px-3 py-2 text-sm text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 transition-all cursor-pointer"
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
                      className="h-4 w-4 text-[var(--unit-accent)] rounded border-[var(--unit-border)]"
                    />
                    <label htmlFor="filterByPaymentMethod" className="text-sm font-medium text-[var(--unit-text)]">
                      Filtrar por método de pago
                    </label>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className={`rounded-unit border-2 ${exportType === 'excel' ? 'border-green-300/50 bg-gradient-to-br from-green-50 to-green-100' : 'border-red-300/50 bg-gradient-to-br from-red-50 to-red-100'} p-4`}>
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
                className={`flex-1 rounded-unit bg-gradient-to-r ${exportType === 'excel' ? 'from-green-600 to-green-700 border-green-500/50' : 'from-red-600 to-red-700 border-red-500/50'} text-white font-bold shadow-unit border-2 transition-all hover:shadow-unit-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100`}
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
                className={`flex-1 rounded-unit border-2 ${exportType === 'excel' ? 'border-green-300/50 text-green-700 hover:bg-green-50' : 'border-red-300/50 text-red-700 hover:bg-red-50'} px-6 py-3 text-sm font-medium bg-white/80 transition-all hover:shadow-unit active:scale-[0.98]`}
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


