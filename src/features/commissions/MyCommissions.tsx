import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { DataTable } from '@/components/ui/DataTable';
import { PersonalCommissionsMetrics } from './PersonalCommissionsMetrics';
import { getCommissionStatusLabel } from '@/lib/translations';
import { DollarSign, Eye, TrendingUp, Calendar, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp, Filter, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { useState } from 'react';
import type { Commission, CommissionsResponse } from '@/types/commission';
import { TableToolbar } from '@/components/ui/TableToolbar';
import { TableBadge } from '@/components/ui/TableBadge';

export function MyCommissions(): JSX.Element {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';
  const canViewAllCommissions = user?.role === 'ADMIN'; // Only ADMIN can view all commissions
  
  // Filter states
  const [dateFrom, setDateFrom] = useState<Date>(startOfDay(subDays(new Date(), 30)));
  const [dateTo, setDateTo] = useState<Date>(endOfDay(new Date()));
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(true);
  const [search, setSearch] = useState<string>('');

  // ✅ MEJORADO: Enviar filtros al backend
  const { data: commissionsResponse, isLoading } = useQuery({
    queryKey: ['commissions', 'mine', statusFilter, dateFrom, dateTo],
    queryFn: async (): Promise<CommissionsResponse> => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (dateFrom) params.append('dateFrom', dateFrom.toISOString());
      if (dateTo) params.append('dateTo', dateTo.toISOString());
      
      const { data } = await api.get<CommissionsResponse>(
        `/api/commissions/mine?${params.toString()}`
      );
      return data;
    },
  });

  // ✅ EXTRAER: Commissions del response (ya viene filtrado del backend)
  const commissions = commissionsResponse?.data ?? [];

  // Filter commissions on frontend (solo para búsqueda)
  const filteredCommissions = commissions?.filter((commission: Commission) => {
    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        commission.sale?.saleNumber?.toLowerCase().includes(searchLower) ||
        commission.status.toLowerCase().includes(searchLower) ||
        commission.amount.toString().includes(searchLower)
      );
    }
    
    return true;
  }) ?? [];

  // Calculate stats
  const totalPending = filteredCommissions
    .filter((c: Commission) => c.status === 'PENDING')
    .reduce((sum: number, c: Commission) => sum + c.amount, 0);
  
  const totalPaid = filteredCommissions
    .filter((c: Commission) => c.status === 'PAID')
    .reduce((sum: number, c: Commission) => sum + c.amount, 0);
  
  const totalApproved = filteredCommissions
    .filter((c: Commission) => c.status === 'APPROVED')
    .reduce((sum: number, c: Commission) => sum + c.amount, 0);

  const columns = [
    {
      key: 'sale',
      header: 'Venta',
      sortable: true,
      render: (row: Commission) => (
        <span className="font-semibold text-[var(--unit-text)]">
          {row.sale?.saleNumber ?? 'Sin venta'}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Monto',
      sortable: true,
      render: (row: Commission) => (
        <TableBadge type="amount" bold mono>
          S/ {row.amount.toFixed(2)}
        </TableBadge>
      ),
    },
    {
      key: 'pctApplied',
      header: '% Comisión',
      sortable: true,
      render: (row: Commission) => (
        <TableBadge type="status-neutral">
          {row.pctApplied}%
        </TableBadge>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row: Commission) => {
        const statusType = 
          row.status === 'PAID' ? 'status-paid' :
          row.status === 'APPROVED' ? 'status-active' :
          row.status === 'PENDING' ? 'status-pending' : 'status-neutral';
        return (
          <TableBadge type={statusType}>
            {getCommissionStatusLabel(row.status)}
          </TableBadge>
        );
      },
    },
    {
      key: 'paidAt',
      header: 'Fecha de Pago',
      sortable: true,
      render: (row: Commission) => (
        <span className="text-sm font-medium text-[var(--unit-text-muted)]">
          {row.paidAt ? format(new Date(row.paidAt), "d MMM yyyy", { locale: es }) : '—'}
        </span>
      ),
    },
    {
      key: 'saleTotal',
      header: 'Total Venta',
      sortable: true,
      render: (row: Commission) => (
        <TableBadge type="amount">
          {row.sale ? `S/ ${row.sale.total.toFixed(2)}` : 'Sin venta'}
        </TableBadge>
      ),
    },
  ];

  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [viewModal, setViewModal] = useState(false);

  const actions = [
    {
      label: 'Ver detalle',
      variant: 'view' as const,
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: Commission) => {
        setSelectedCommission(row);
        setViewModal(true);
      },
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
                Mi Rendimiento Individual
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--unit-text)] tracking-tight">
              Mis Comisiones Ganadas
            </h1>
            <p className="text-xs sm:text-sm text-[var(--unit-text-muted)]">
              Registro personal de servicios prestados, ventas y estado de liquidación
            </p>
          </div>

          {/* Action Links */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {canViewAllCommissions && (
              <Link 
                href="/commissions/admin" 
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-unit bg-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/90 text-white text-xs font-bold transition-all shadow-unit active:scale-[0.98]"
              >
                <Eye className="h-4 w-4" />
                Panel Administrador
              </Link>
            )}
          </div>
        </div>

        {/* Personal Commissions Metrics */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--unit-accent)] border-t-transparent"></div>
            <span className="ml-2 text-[var(--unit-text)]">Cargando métricas...</span>
          </div>
        ) : (
          <PersonalCommissionsMetrics commissions={commissions} />
        )}

        {/* Enhanced Commissions Filters */}
        <div className="mb-8">
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por venta, estado o monto..."
            chips={[
              { id: '', label: 'Todas', count: commissions.length },
              { id: 'PENDING', label: 'Pendientes', activeColor: 'bg-amber-500 text-white' },
              { id: 'APPROVED', label: 'Aprobadas', activeColor: 'bg-indigo-600 text-white' },
              { id: 'PAID', label: 'Pagadas', activeColor: 'bg-emerald-600 text-white' },
            ]}
            activeChip={statusFilter}
            onChipChange={(id) => setStatusFilter(String(id))}
            showAdvancedFiltersButton={true}
            isAdvancedOpen={showFilters}
            onToggleAdvanced={() => setShowFilters(!showFilters)}
            activeFiltersCount={(statusFilter ? 1 : 0) + (search ? 1 : 0)}
            onResetFilters={() => {
              setStatusFilter('');
              setSearch('');
              setDateFrom(startOfDay(subDays(new Date(), 30)));
              setDateTo(endOfDay(new Date()));
            }}
            advancedFiltersContent={
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Fecha Desde</label>
                  <input
                    type="date"
                    value={dateFrom ? dateFrom.toISOString().split('T')[0] : ''}
                    onChange={(e) => setDateFrom(e.target.value ? new Date(e.target.value) : dateFrom)}
                    className="w-full rounded-unit border border-[var(--unit-border)]/60 px-3 py-2 text-sm text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Fecha Hasta</label>
                  <input
                    type="date"
                    value={dateTo ? dateTo.toISOString().split('T')[0] : ''}
                    onChange={(e) => setDateTo(e.target.value ? new Date(e.target.value) : dateTo)}
                    className="w-full rounded-unit border border-[var(--unit-border)]/60 px-3 py-2 text-sm text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                  />
                </div>
              </div>
            }
          />
        </div>

        {/* Commissions Table */}
        <div className="relative overflow-hidden rounded-unit-lg border border-[var(--unit-border)]/60 bg-[var(--unit-surface)] shadow-unit p-6">
          {/* Table Header */}
          <div className="bg-[var(--unit-surface-elevated)] px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-unit bg-[var(--unit-accent)] text-white shadow-unit">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Mis Comisiones</h3>
                  <p className="text-sm text-[var(--unit-text-muted)]">Revisa tus comisiones generadas</p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-[var(--unit-accent)]/15 px-3 py-1.5 text-sm font-bold text-[var(--unit-accent)] border border-[var(--unit-accent)]/30 shadow-unit-sm">
                {filteredCommissions?.length || 0} comisiones
              </span>
            </div>
          </div>

          {/* Table */}
          <DataTable
            columns={columns}
            data={filteredCommissions ?? []}
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

        {/* View Commission Details Modal */}
        {viewModal && selectedCommission && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative overflow-hidden rounded-unit-lg border border-[var(--unit-border)]/60 bg-[var(--unit-surface)] shadow-unit-lg p-6 sm:p-8 max-w-lg w-full">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-[var(--unit-border)]/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-unit bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                    <Eye className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--unit-text)]">Detalle de Comisión</h3>
                    <p className="text-xs text-[var(--unit-text-muted)]">ID: {selectedCommission.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-unit border border-[var(--unit-border)]/40 hover:bg-[var(--unit-surface-elevated)] transition-all"
                >
                  <X className="h-4 w-4 text-[var(--unit-text-muted)]" />
                </button>
              </div>

              {/* Details Content */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 p-4 rounded-unit bg-[var(--unit-surface-elevated)] border border-[var(--unit-border)]/30">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--unit-text-muted)]">Monto Comisión</span>
                    <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      S/ {Number(selectedCommission.amount).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--unit-text-muted)]">Porcentaje</span>
                    <p className="text-xl font-extrabold text-[var(--unit-text)] mt-0.5">
                      {selectedCommission.pctApplied}%
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between py-1.5 border-b border-[var(--unit-border)]/20">
                    <span className="text-[var(--unit-text-muted)]">Estado:</span>
                    <TableBadge type={
                      selectedCommission.status === 'PAID' ? 'status-paid' :
                      selectedCommission.status === 'APPROVED' ? 'status-active' :
                      'status-pending'
                    }>
                      {getCommissionStatusLabel(selectedCommission.status)}
                    </TableBadge>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-[var(--unit-border)]/20">
                    <span className="text-[var(--unit-text-muted)]">Número de Venta:</span>
                    <span className="font-semibold text-[var(--unit-text)]">
                      {selectedCommission.sale?.saleNumber || selectedCommission.sale?.id || 'N/A'}
                    </span>
                  </div>

                  {selectedCommission.sale?.total != null && (
                    <div className="flex items-center justify-between py-1.5 border-b border-[var(--unit-border)]/20">
                      <span className="text-[var(--unit-text-muted)]">Total de la Venta:</span>
                      <span className="font-semibold text-[var(--unit-text)]">
                        S/ {Number(selectedCommission.sale.total).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between py-1.5 border-b border-[var(--unit-border)]/20">
                    <span className="text-[var(--unit-text-muted)]">Fecha de Generación:</span>
                    <span className="text-[var(--unit-text)]">
                      {selectedCommission.createdAt ? format(new Date(selectedCommission.createdAt), "dd/MM/yyyy HH:mm", { locale: es }) : '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[var(--unit-text-muted)]">Fecha de Liquidación:</span>
                    <span className="text-[var(--unit-text)] font-medium">
                      {selectedCommission.paidAt ? format(new Date(selectedCommission.paidAt), "dd/MM/yyyy HH:mm", { locale: es }) : 'Pendiente de pago'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-[var(--unit-border)]/30 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewModal(false)}
                  className="px-5 py-2 rounded-unit bg-[var(--unit-surface-elevated)] border border-[var(--unit-border)]/50 text-sm font-semibold text-[var(--unit-text)] hover:border-[var(--unit-accent)]/50 transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
