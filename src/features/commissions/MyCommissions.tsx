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
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800">
          {row.sale?.saleNumber ?? 'Sin venta'}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Monto',
      sortable: true,
      render: (row: Commission) => (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800">
          S/ {row.amount.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'pctApplied',
      header: '% Comisión',
      sortable: true,
      render: (row: Commission) => (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-800">
          {row.pctApplied}%
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row: Commission) => (
        <span className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          row.status === 'PAID'
            ? 'bg-green-100 text-green-800'
            : row.status === 'APPROVED'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'
        )}>
          {getCommissionStatusLabel(row.status)}
        </span>
      ),
    },
    {
      key: 'paidAt',
      header: 'Fecha de Pago',
      sortable: true,
      render: (row: Commission) => (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-800">
          {row.paidAt ? format(new Date(row.paidAt), "d MMM yyyy", { locale: es }) : 'Sin pago'}
        </span>
      ),
    },
    {
      key: 'saleTotal',
      header: 'Total Venta',
      sortable: true,
      render: (row: Commission) => (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
          {row.sale ? `S/ ${row.sale.total.toFixed(2)}` : 'Sin venta'}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: 'Ver',
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: Commission) => {
        // TODO: Implement view commission details
      },
      className: 'text-blue-600 hover:bg-blue-50',
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
                Mis Comisiones
              </span>
            </div>
            <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">Mis Comisiones</h1>
            <p className="text-[var(--unit-text-muted)]">
              Gestiona y revisa tus comisiones generadas
            </p>
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

          {/* Enhanced Action Buttons - Exacto estilo ServicesPage */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {canViewAllCommissions && (
              <Link href="/commissions/admin" className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white font-bold shadow-lg border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
                <Eye className="h-5 w-5" />
                Todas las Comisiones (Admin)
              </Link>
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
              {/* Additional Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Estado</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                  >
                    <option value="">Todos los estados</option>
                    <option value="PENDING">Pendientes</option>
                    <option value="APPROVED">Aprobadas</option>
                    <option value="PAID">Pagadas</option>
                  </select>
                </div>

                {/* Date Range Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Rango de Fechas</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={dateFrom ? dateFrom.toISOString().split('T')[0] : ''}
                      onChange={(e) => setDateFrom(e.target.value ? new Date(e.target.value) : dateFrom)}
                      className="rounded-xl border-2 border-[var(--unit-border)]/50 px-3 py-2 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                    />
                    <input
                      type="date"
                      value={dateTo ? dateTo.toISOString().split('T')[0] : ''}
                      onChange={(e) => setDateTo(e.target.value ? new Date(e.target.value) : dateTo)}
                      className="rounded-xl border-2 border-[var(--unit-border)]/50 px-3 py-2 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                    />
                  </div>
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
                      placeholder="Buscar por venta, estado..."
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
              {(statusFilter || search) && (
                <div className="rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Filtros activos:</span>
                      <div className="flex flex-wrap gap-2">
                        {statusFilter && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 border border-purple-200">
                            Estado: {getCommissionStatusLabel(statusFilter)}
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
                        setStatusFilter('');
                        setSearch('');
                        setDateFrom(startOfDay(subDays(new Date(), 30)));
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
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Mis Comisiones</h3>
                  <p className="text-sm text-[var(--unit-text-muted)]">Revisa tus comisiones generadas</p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-[var(--unit-accent)]/20 px-3 py-1.5 text-sm font-bold text-[var(--unit-accent)] border border-[var(--unit-accent)]/30 shadow-sm">
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
      </div>
    </div>
  );
}
