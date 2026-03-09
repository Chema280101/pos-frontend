import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { DollarSign, User, Calendar, Receipt, Building2, CheckCircle, Clock, XCircle, Eye, X, RefreshCw, Download, Search, Filter, ChevronDown, ChevronUp, AlertCircle, TrendingUp } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { CommissionsMetrics } from './CommissionsMetrics';
import { cn } from '@/lib/utils';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import type { Commission, CommissionsResponse } from '@/types/commission';

// Interface para grouped commissions (agrupadas por empleado y fecha)
interface GroupedCommission {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeUnit: string;
  date: string;
  status: string;
  totalSales: number;
  totalAmount: number;
  commissions: Commission[];
  createdAt: string;
  sale: Commission['sale'];
}

export function AdminCommissions(): JSX.Element {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<Date>(startOfDay(subDays(new Date(), 7)));
  const [dateTo, setDateTo] = useState<Date>(endOfDay(new Date()));
  const [showFilters, setShowFilters] = useState(true);
  
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [viewModal, setViewModal] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<GroupedCommission | null>(null);

  // ✅ MEJORADO: Enviar filtros al backend
  const { data: commissionsResponse, isLoading, error } = useQuery({
    queryKey: ['commissions', 'all', unitFilter, statusFilter, dateFrom, dateTo],
    queryFn: async (): Promise<CommissionsResponse> => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (unitFilter) params.append('unit', unitFilter);
      if (dateFrom) params.append('dateFrom', dateFrom.toISOString());
      if (dateTo) params.append('dateTo', dateTo.toISOString());
      
      const { data } = await api.get<CommissionsResponse>(
        `/api/commissions/all?${params.toString()}`
      );
      return data;
    },
  });

  // ✅ EXTRAER: Commissions del response (ya viene filtrado del backend)
  const commissions = commissionsResponse?.data ?? [];

  // Group commissions by employee and date
  const groupedCommissions = useMemo(() => {
    const groups: Record<string, Commission[]> = {};
    
    commissions.forEach(commission => {
      // Create group key: employeeId_date
      const commissionDate = new Date(commission.createdAt);
      const dateKey = commissionDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const groupKey = `${commission.user.id}_${dateKey}`;
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(commission);
    });
    
    // Convert groups to array with aggregated data
    return Object.entries(groups).map(([groupKey, commissionList]) => {
      const [employeeId, date] = groupKey.split('_');
      const firstCommission = commissionList[0];
      
      // Calculate totals
      const totalAmount = commissionList.reduce((sum, c) => sum + c.amount, 0);
      const totalSales = commissionList.length;
      const allPaid = commissionList.every(c => c.status === 'PAID');
      const allPending = commissionList.every(c => c.status === 'PENDING');
      
      // Determine status
      let status = 'MIXED';
      if (allPaid) status = 'PAID';
      else if (allPending) status = 'PENDING';
      
      return {
        id: groupKey, // Use groupKey as ID
        employeeId,
        employeeName: firstCommission.user.name,
        employeeUnit: firstCommission.user.unit,
        date,
        totalAmount,
        totalSales,
        status,
        commissions: commissionList, // Keep original commissions for details
        createdAt: firstCommission.createdAt, // Use first commission date
        sale: firstCommission.sale, // Use first sale reference
      };
    });
  }, [commissions]);

  // Calculate stats
  const pending = commissions.filter((c: Commission) => c.status === 'PENDING');
  const paid = commissions.filter((c: Commission) => c.status === 'PAID');
  const approved = commissions.filter((c: Commission) => c.status === 'APPROVED');
  
  const totalPending = pending.reduce((sum: number, c: Commission) => sum + c.amount, 0);
  const totalPaid = paid.reduce((sum: number, c: Commission) => sum + c.amount, 0);
  const totalApproved = approved.reduce((sum: number, c: Commission) => sum + c.amount, 0);

  const markPaidMutation = useMutation({
    mutationFn: async ({ groupId, method, notes }: { groupId: string; method: string; notes: string }) => {
      // Find the group and mark all commissions as paid
      const group = groupedCommissions.find(g => g.id === groupId);
      if (!group) throw new Error('Group not found');
      
      // Mark all commissions in the group as paid
      const promises = group.commissions.map(commission => 
        api.patch(`/api/commissions/${commission.id}/paid`, {
        paymentMethod: method || undefined,
        paymentNotes: notes || undefined,
        })
      );
      
      await Promise.all(promises);
      return group;
    },
    onSuccess: () => {
      setPayingId(null);
      setPaymentMethod('');
      setPaymentNotes('');
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
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
      console.error('Error voiding commission:', error);
      alert('Error al anular la comisión');
    },
  });

  // Recalculate commission mutation
  const recalculateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/api/commissions/${id}/recalculate`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      alert('Comisión recalculada exitosamente');
    },
    onError: (error) => {
      console.error('Error recalculating commission:', error);
      alert('Error al recalcular la comisión');
    },
  });

  // Export commissions mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      // Create CSV from filtered data
      const csvData = generateCSV(commissions);
      return csvData;
    },
    onSuccess: (data) => {
      // Create download link
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Generate filename with filters
      const dateStr = new Date().toISOString().split('T')[0];
      let filename = `commissions_${dateStr}`;
      if (unitFilter) filename += `_${unitFilter.toLowerCase()}`;
      if (statusFilter) filename += `_${statusFilter.toLowerCase()}`;
      if (dateFrom && dateTo) {
        filename += `_${format(dateFrom, 'dd-MM-yyyy')}_to_${format(dateTo, 'dd-MM-yyyy')}`;
      }
      filename += '.csv';
      
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    onError: (error) => {
      console.error('Error exporting commissions:', error);
      alert('Error al exportar comisiones');
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
      new Date(c.createdAt).toLocaleString('es-PE'),
      c.paidAt ? new Date(c.paidAt).toLocaleString('es-PE') : '',
      c.paymentMethod || '',
      c.paymentNotes || '',
      c.sale?.id || '',
      c.sale?.saleNumber || ''
    ]);
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
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
      case 'APPROVED': return 'bg-blue-100 text-blue-800';
      case 'PENDING': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    {
      key: 'employee',
      header: 'Empleado',
      sortable: true,
      render: (row: any) => (
        <div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-[var(--unit-text-muted)]" />
            <span className="font-medium text-[var(--unit-text-muted)]">{row.employeeName}</span>
          </div>
          {row.employeeUnit && (
            <div className="flex items-center gap-1 mt-1">
              <Building2 className="h-3 w-3 text-[var(--unit-text-muted)]" />
              <span className="text-sm text-[var(--unit-text-muted)]">{row.employeeUnit}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Fecha',
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-[var(--unit-text-muted)]" />
          <span className="text-[var(--unit-text-muted)]">
            {format(new Date(row.date), 'd MMM yyyy', { locale: es })}
          </span>
        </div>
      ),
    },
    {
      key: 'totalSales',
      header: 'Ventas',
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-1">
          <Receipt className="h-3 w-3 text-[var(--unit-text-muted)]" />
          <span className="font-medium text-[var(--unit-text-muted)]">{row.totalSales}</span>
        </div>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Comisión Total',
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-1">
          <DollarSign className="h-3 w-3 text-[var(--unit-text-muted)]" />
          <span className="font-medium text-[var(--unit-text-muted)]">S/ {row.totalAmount.toFixed(2)}</span>
        </div>
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
          {getStatusIcon(row.status)}
          <span className="ml-1">
            {row.status === 'PENDING' ? 'Pendiente' : 
             row.status === 'APPROVED' ? 'Aprobada' : 
             row.status === 'PAID' ? 'Pagada' : 'Mixto'}
          </span>
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Fecha Creación',
      sortable: true,
      render: (row: any) => {
        const date = new Date(row.createdAt);
        // ✅ MEJORADO: Usar date-fns para formato consistente
        return (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-[var(--unit-text-muted)]" />
            <div>
              <div className="font-medium text-[var(--unit-text-muted)]">
                {format(date, "d MMM yyyy", { locale: es })}
              </div>
              <div className="text-sm text-[var(--unit-text-muted)]">
                {format(date, "h:mm a", { locale: es })}
              </div>
            </div>
          </div>
        );
      },
    },
  ];

  const actions = [
    {
      label: 'Ver detalles',
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: any) => {
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
        if (confirm('¿Estás seguro de recalcular todas las comisiones de este día?')) {
          // Recalculate all commissions in this group
          row.commissions.forEach((commission: Commission) => {
            recalculateMutation.mutate(commission.id);
          });
        }
      },
      className: 'text-amber-600 hover:bg-amber-50',
      disabled: (row: any) => row.status === 'PAID',
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
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg border-2 border-emerald-600/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Download className="h-5 w-5" />
              {exportMutation.isPending ? 'Exportando...' : 'Exportar'}
            </button>
            <Link href="/commissions" className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white font-bold shadow-lg border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
              <DollarSign className="h-5 w-5" />
              Mis Comisiones
            </Link>
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
              {/* Date Range Filter */}
              <DateRangeFilter
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={(date: Date | null) => date && setDateFrom(date)}
                onDateToChange={(date: Date | null) => date && setDateTo(date)}
                unit={unitFilter}
                onUnitChange={setUnitFilter}
                status={statusFilter}
                onStatusChange={setStatusFilter}
                showUnitFilter={true}
                showStatusFilter={true}
                className="rounded-xl"
              />

              {/* Enhanced Active Filters Summary */}
              {(unitFilter || statusFilter) && (
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
                        {statusFilter && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 border border-purple-200">
                            Estado: {statusFilter === 'PENDING' ? 'Pendientes' : statusFilter === 'APPROVED' ? 'Aprobadas' : 'Pagadas'}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setUnitFilter('');
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

        {/* Payment Modal - Premium Glassmorphism */}
        {payingId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-8 max-w-lg w-full">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="h-full w-full bg-repeat" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
              </div>
              
              <div className="relative">
                {/* Enhanced Header - Exacto estilo ServicesPage */}
                <div className="relative bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 px-6 py-4 border-b border-emerald-200/30 -mx-8 -mt-8 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg group-hover:scale-110 transition-transform">
                        <DollarSign className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[var(--unit-text)]">Liquidar Comisión</h3>
                        <p className="text-sm text-[var(--unit-text-muted)]">Registrar pago de comisión</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setPayingId(null);
                        setPaymentMethod('');
                        setPaymentNotes('');
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-[var(--unit-border)]/30 bg-[var(--unit-surface)] hover:bg-[var(--unit-surface-elevated)] transition-all group"
                    >
                      <X className="h-4 w-4 text-[var(--unit-text-muted)] group-hover:text-red-500 transition-colors" />
                    </button>
                  </div>
                </div>

                {/* Enhanced Form Content */}
                <div className="space-y-6">
                  {/* Payment Method Field - Glassmorphism Card */}
                  <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                    <div className="relative">
                      {/* Field Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-300/30">
                          <DollarSign className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <label className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Método de pago</label>
                          <p className="text-xs text-[var(--unit-text-muted)]">Selecciona el método de pago</p>
                        </div>
                      </div>

                      {/* Enhanced Select */}
                      <div className="relative">
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full rounded-xl border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-3 text-[var(--unit-text)] font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all appearance-none cursor-pointer hover:border-emerald-400/50"
                          required
                        >
                          <option value="" className="text-[var(--unit-text-muted)]">Seleccionar método...</option>
                          <option value="Efectivo" className="text-[var(--unit-text)]">💵 Efectivo</option>
                          <option value="Transferencia" className="text-[var(--unit-text)]">🏦 Transferencia</option>
                          <option value="Yape" className="text-[var(--unit-text)]">📱 Yape</option>
                          <option value="Plin" className="text-[var(--unit-text)]">📱 Plin</option>
                          <option value="Tarjeta" className="text-[var(--unit-text)]">💳 Tarjeta</option>
                          <option value="Depósito" className="text-[var(--unit-text)]">🏧 Depósito</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                          <ChevronDown className="h-5 w-5 text-emerald-600" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes Field - Glassmorphism Card */}
                  <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                    <div className="relative">
                      {/* Field Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                          <Receipt className="h-4 w-4 text-[var(--unit-accent)]" />
                        </div>
                        <div>
                          <label className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Notas</label>
                          <p className="text-xs text-[var(--unit-text-muted)]">Notas adicionales (opcional)</p>
                        </div>
                      </div>

                      {/* Enhanced Textarea */}
                      <textarea
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        placeholder="Añade notas o referencias del pago..."
                        className="w-full rounded-xl border-2 border-[var(--unit-accent)]/30 bg-gradient-to-r from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] px-4 py-3 text-[var(--unit-text)] font-medium placeholder-[var(--unit-text-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all resize-none hover:border-[var(--unit-accent)]/50"
                        rows={4}
                      />
                    </div>
                  </div>

                  {/* Summary Card - Glassmorphism */}
                  <div className="relative overflow-hidden rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/50 to-emerald-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 border border-emerald-600 shadow-lg">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-emerald-800 uppercase tracking-wider">Resumen de Liquidación</h4>
                          <p className="text-xs text-emerald-700">Confirma los datos antes de procesar</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-emerald-200/50">
                          <span className="text-sm font-medium text-emerald-700">Método seleccionado</span>
                          <span className="font-bold text-emerald-800 bg-white px-3 py-1 rounded-lg border border-emerald-300/50">
                            {paymentMethod || 'No seleccionado'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm font-medium text-emerald-700">Estado</span>
                          <span className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle className="h-3 w-3" />
                            Listo para liquidar
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Footer Actions */}
                <div className="relative bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 px-6 py-4 border-t border-emerald-200/30 -mx-8 -mb-8 mt-6">
                  <div className="flex gap-4">
                    <button 
                      type="button" 
                      onClick={() => {
                        setPayingId(null);
                        setPaymentMethod('');
                        setPaymentNotes('');
                      }} 
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-[var(--unit-border)]/30 bg-[var(--unit-surface)] hover:bg-[var(--unit-surface-elevated)] text-[var(--unit-text)] font-bold transition-all hover:scale-[1.02] active:scale-[0.98] group"
                    >
                      <X className="h-4 w-4 text-[var(--unit-text-muted)] group-hover:text-red-500 transition-colors" />
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => markPaidMutation.mutate({ groupId: payingId, method: paymentMethod, notes: paymentNotes })}
                      disabled={markPaidMutation.isPending || !paymentMethod.trim()}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg border-2 border-emerald-600/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      {markPaidMutation.isPending ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                          Liquidando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Liquidar Comisión
                        </>
                      )}
                    </button>
                  </div>
                </div>
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
                          {selectedCommission.employeeName} - {format(new Date(selectedCommission.date), 'd MMM yyyy', { locale: es })}
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
                            {selectedCommission.employeeName}
                          </span>
                        </div>

                        {/* Unit */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Unidad</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                            {selectedCommission.employeeUnit || '—'}
                          </span>
                        </div>

                        {/* Date */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Fecha</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                            {format(new Date(selectedCommission.date), 'd MMM yyyy', { locale: es })}
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
                          {selectedCommission.commissions.length} ventas
                        </span>
                      </div>

                      {/* Enhanced Commissions List */}
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {selectedCommission.commissions.map((commission: Commission, index: number) => (
                          <div key={commission.id} className="group/commission relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/20 bg-gradient-to-br from-white to-[var(--unit-surface)] p-4 hover:border-[var(--unit-accent)]/30 hover:shadow-lg transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover/commission:opacity-100 transition-opacity rounded-xl"></div>
                            <div className="relative">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Receipt className="h-4 w-4 text-[var(--unit-text-muted)]" />
                                    <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-2 py-1 rounded-lg border border-[var(--unit-border)]/30">
                                      Venta #{commission.sale?.saleNumber || 'N/A'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-[var(--unit-text-muted)]">
                                    <Clock className="h-3 w-3" />
                                    <span>{format(new Date(commission.createdAt), 'HH:mm', { locale: es })}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="flex items-center gap-1 mb-1">
                                    <DollarSign className="h-3 w-3 text-emerald-600" />
                                    <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                                      S/ {commission.amount.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-[var(--unit-text-muted)]">
                                    <TrendingUp className="h-3 w-3" />
                                    <span>{commission.pctApplied}%</span>
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
      </div>
    </div>
  );
}
