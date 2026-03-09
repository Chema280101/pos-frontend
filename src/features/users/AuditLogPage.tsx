'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button, Skeleton, DataTable } from '@/components/ui';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { AuditMetrics } from './AuditMetrics';
import { Download, Calendar, User, Activity, Database, Fingerprint, Monitor, AlertCircle, FileText, Filter, ChevronUp, ChevronDown, Search, X } from 'lucide-react';
import { downloadExcelReport } from '@/lib/excelReport';
import { downloadPdfReport } from '@/lib/pdfReport';
import { useBusinessConfig } from '@/hooks/useBusinessConfig';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { startOfDay, endOfDay, subDays } from 'date-fns';

interface AuditRow {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  before: unknown;
  after: unknown;
  device: string | null;
  ipAddress: string | null;
  createdAt: string;
}

interface AuditResponse {
  data: AuditRow[];
  total: number;
}

export function AuditLogPage(): JSX.Element {
  const [dateFrom, setDateFrom] = useState(() => startOfDay(subDays(new Date(), 7)));
  const [dateTo, setDateTo] = useState(() => endOfDay(new Date()));
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true);
  const limit = 30;

  // ✅ MEJORADO: Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [dateFrom, dateTo, action, entity, searchFilter]);

  // ✅ MEJORADO: Solo usar isHydrated para loading state
  const isHydrated = useAuthStore((s) => s.isHydrated);

  // Wait for hydration before rendering - moved to end
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[var(--unit-surface)] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--unit-accent)] mx-auto mb-4"></div>
              <p className="text-[var(--unit-text-muted)]">Cargando...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const params = new URLSearchParams();
  if (dateFrom) params.set('from', dateFrom.toISOString());
  if (dateTo) params.set('to', dateTo.toISOString());
  if (action) params.set('action', action);
  if (entity) params.set('entity', entity);
  if (searchFilter) params.set('search', searchFilter);
  params.set('page', String(page));
  params.set('limit', String(limit));

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit', dateFrom, dateTo, action, entity, searchFilter, page],
    queryFn: async (): Promise<AuditResponse> => {
      try {
      const { data: res } = await api.get<AuditResponse>(`/api/audit?${params}`);
      return res;
      } catch (err) {
        console.error('Error fetching audit data:', err);
        throw err;
      }
    },
  });

  const exportExcel = useCallback(async () => {
    const exportParams = new URLSearchParams();
    if (dateFrom) exportParams.set('from', dateFrom.toISOString());
    if (dateTo) exportParams.set('to', dateTo.toISOString());
    if (action) exportParams.set('action', action);
    if (entity) exportParams.set('entity', entity);
    if (searchFilter) exportParams.set('search', searchFilter);
    exportParams.set('exportLimit', '5000'); // ✅ NUEVO: Limitar exportación
    const { data: rows } = await api.get<AuditRow[]>(`/api/audit/export?${exportParams}`);
    if (!rows?.length) return;
    await downloadExcelReport(
      `auditoria-${new Date().toISOString().slice(0, 10)}.xlsx`,
      'Auditoría',
      ['Fecha', 'Usuario', 'Acción', 'Entidad', 'ID', 'IP / Dispositivo'],
      rows.map((row) => [
        new Date(row.createdAt).toLocaleString('es'),
        row.userName,
        row.action,
        row.entity,
        row.entityId,
        row.ipAddress ?? row.device ?? '—',
      ])
    );
  }, [dateFrom, dateTo, action, entity, searchFilter]);

  const { data: businessConfig } = useBusinessConfig();
  const exportPdf = useCallback(() => {
    const rows = data?.data ?? [];
    if (rows.length === 0) return;
    const fromDateStr = dateFrom ? dateFrom.toLocaleDateString('es-PE') : '…';
    const toDateStr = dateTo ? dateTo.toLocaleDateString('es-PE') : '…';
    const subtitle = [fromDateStr, toDateStr].filter(Boolean).length ? `Filtro: ${fromDateStr} a ${toDateStr}` : 'Página actual';
    downloadPdfReport(
      `auditoria-${new Date().toISOString().slice(0, 10)}.pdf`,
      'Registro de auditoría',
      subtitle,
      ['Fecha', 'Usuario', 'Acción', 'Entidad', 'ID', 'IP / Dispositivo'],
      rows.map((row) => [
        new Date(row.createdAt).toLocaleString('es'),
        row.userName,
        row.action,
        row.entity,
        row.entityId,
        row.ipAddress ?? row.device ?? '—',
      ]),
      {
        businessName: businessConfig?.businessName,
        businessAddress: businessConfig?.businessAddress,
        businessPhone: businessConfig?.businessPhone,
      }
    );
  }, [data?.data, dateFrom, dateTo, businessConfig]);

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Define columns for DataTable
  const columns = [
    {
      key: 'createdAt',
      header: 'Fecha',
      sortable: true,
      render: (row: AuditRow) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[var(--unit-text-muted)]" />
          <span className="font-medium text-[var(--unit-text)]">
            {new Date(row.createdAt).toLocaleString('es')}
          </span>
        </div>
      ),
    },
    {
      key: 'userName',
      header: 'Usuario',
      sortable: true,
      render: (row: AuditRow) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-[var(--unit-text-muted)]" />
          <span>{row.userName}</span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Acción',
      sortable: true,
      render: (row: AuditRow) => (
        <span className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          row.action === 'LOGIN' || row.action === 'LOGOUT'
            ? 'bg-blue-100 text-blue-800'
            : row.action === 'CREATE'
            ? 'bg-green-100 text-green-800'
            : row.action === 'UPDATE'
            ? 'bg-amber-100 text-amber-800'
            : row.action === 'DELETE'
            ? 'bg-red-100 text-red-800'
            : 'bg-gray-100 text-gray-800'
        )}>
          {row.action}
        </span>
      ),
    },
    {
      key: 'entity',
      header: 'Entidad',
      sortable: true,
      render: (row: AuditRow) => (
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-[var(--unit-text-muted)]" />
          <span className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            row.entity === 'USER'
              ? 'bg-purple-100 text-purple-800'
              : row.entity === 'CLIENT'
              ? 'bg-blue-100 text-blue-800'
              : row.entity === 'PRODUCT' || row.entity === 'SERVICE'
              ? 'bg-green-100 text-green-800'
              : row.entity === 'SALE'
              ? 'bg-amber-100 text-amber-800'
              : row.entity === 'APPOINTMENT'
              ? 'bg-pink-100 text-pink-800'
              : row.entity === 'CASH_REGISTER'
              ? 'bg-indigo-100 text-indigo-800'
              : 'bg-gray-100 text-gray-800'
          )}>
            {row.entity}
          </span>
        </div>
      ),
    },
    {
      key: 'entityId',
      header: 'ID',
      sortable: true,
      render: (row: AuditRow) => (
        <div className="flex items-center gap-2">
          <Fingerprint className="h-4 w-4 text-[var(--unit-text-muted)]" />
          <span 
            className="max-w-[120px] truncate font-mono text-xs text-[var(--unit-text-muted)]" 
            title={row.entityId}
          >
            {row.entityId}
          </span>
        </div>
      ),
    },
    {
      key: 'device',
      header: 'IP / Dispositivo',
      sortable: true,
      render: (row: AuditRow) => (
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-[var(--unit-text-muted)]" />
          <span 
            className="max-w-[180px] truncate text-xs text-[var(--unit-text-muted)]" 
            title={row.ipAddress ?? row.device ?? ''}
          >
            {row.ipAddress ?? row.device ?? '—'}
          </span>
        </div>
      ),
    },
  ];

  // Helper functions for custom filtering
  const getActionCategory = (action: string) => {
    if (action === 'LOGIN' || action === 'LOGOUT') return 'LOGIN_LOGOUT';
    return action;
  };

  const getEntityCategory = (entity: string) => {
    if (entity === 'PRODUCT' || entity === 'SERVICE') return 'PRODUCT_SERVICE';
    return entity;
  };

  // Apply filters to audit data
  const filteredAuditData = useMemo(() => {
    if (!data?.data) return [];
    return data.data;
  }, [data]);

  // Custom filter logic for DataTable
  const customFilterLogic = (auditData: AuditRow[], filterValues: Record<string, any>) => {
    return auditData.filter((row: AuditRow) => {
      // Date filters
      if (filterValues.from && new Date(row.createdAt) < new Date(filterValues.from)) return false;
      if (filterValues.to && new Date(row.createdAt) > new Date(filterValues.to + 'T23:59:59')) return false;
      
      // Action filter
      if (filterValues.action) {
        const actionCategory = getActionCategory(row.action);
        if (filterValues.action === 'LOGIN_LOGOUT') {
          if (row.action !== 'LOGIN' && row.action !== 'LOGOUT') return false;
        } else if (actionCategory !== filterValues.action) {
          return false;
        }
      }
      
      // Entity filter
      if (filterValues.entity) {
        const entityCategory = getEntityCategory(row.entity);
        if (filterValues.entity === 'PRODUCT_SERVICE') {
          if (row.entity !== 'PRODUCT' && row.entity !== 'SERVICE') return false;
        } else if (entityCategory !== filterValues.entity) {
          return false;
        }
      }

      // hasIpAddress filter
      if (filterValues.hasIpAddress && !row.ipAddress) return false;

      // hasDevice filter
      if (filterValues.hasDevice && !row.device) return false;
      
      return true;
    });
  };

  const recentAuditCount = data?.data?.filter((row: AuditRow) => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  return new Date(row.createdAt) > oneHourAgo;
}).length ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--unit-surface)] via-[var(--unit-surface-elevated)] to-[var(--unit-surface)]">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto p-6">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-4">
              <div className="h-2 w-2 rounded-full bg-[var(--unit-accent)] animate-pulse"></div>
              <span className="text-sm font-medium text-[var(--unit-text)]">
                Sistema de Auditoría
              </span>
            </div>
            <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">Auditoría</h1>
            <p className="text-[var(--unit-text-muted)]">
              Registro de acciones sensibles y actividad del sistema
            </p>
          </div>

          {/* Audit Metrics */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--unit-accent)] border-t-transparent"></div>
              <span className="ml-2 text-[var(--unit-text)]">Cargando métricas...</span>
            </div>
          ) : (
            <AuditMetrics data={data?.data || []} dateFrom={dateFrom} dateTo={dateTo} />
          )}

          {/* Enhanced Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={exportExcel}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold shadow-lg border-2 border-green-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="h-5 w-5" />
              Exportar Excel
            </button>
            <button
              type="button"
              onClick={exportPdf}
              disabled={!data?.data?.length}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold shadow-lg border-2 border-red-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100"
            >
              <Download className="h-5 w-5" />
              Exportar PDF
            </button>
          </div>
        </div>

        {/* Enhanced Audit Filters */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6 mb-8">
          {/* Filter Header */}
          <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Filtros de Auditoría</h3>
                  <p className="text-sm text-[var(--unit-text-muted)]">Refina tu búsqueda</p>
                </div>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/80 hover:bg-white border border-[var(--unit-border)]/50 transition-all hover:scale-105"
              >
                {showFilters ? <ChevronUp className="h-4 w-4 text-[var(--unit-text)]" /> : <ChevronDown className="h-4 w-4 text-[var(--unit-text)]" />}
              </button>
            </div>
          </div>

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
              />

              {/* Additional Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                {/* Action Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Acción</label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 bg-white/90 px-4 py-3 text-sm text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 backdrop-blur-sm"
                  >
                    <option value="">Todas las acciones</option>
                    <option value="CREATE">Creación</option>
                    <option value="UPDATE">Actualización</option>
                    <option value="DELETE">Eliminación</option>
                    <option value="LOGIN">Inicio de sesión</option>
                    <option value="LOGOUT">Cierre de sesión</option>
                    <option value="UNLOCK">Desbloqueo</option>
                    <option value="RESET_PASSWORD">Reseteo de contraseña</option>
                  </select>
                </div>

                {/* Entity Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Entidad</label>
                  <select
                    value={entity}
                    onChange={(e) => setEntity(e.target.value)}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 bg-white/90 px-4 py-3 text-sm text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 backdrop-blur-sm"
                  >
                    <option value="">Todas las entidades</option>
                    <option value="USER">Usuario</option>
                    <option value="SALE">Venta</option>
                    <option value="APPOINTMENT">Cita</option>
                    <option value="CASH_REGISTER">Caja</option>
                    <option value="PRODUCT">Producto</option>
                    <option value="SERVICE">Servicio</option>
                    <option value="CLIENT">Cliente</option>
                  </select>
                </div>
              </div>

              {/* Search Bar */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Búsqueda</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-[var(--unit-text-muted)]" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar en auditoría (usuario, acción, entidad, IP, dispositivo...)"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 pl-12 pr-12 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all placeholder:text-[var(--unit-text-muted)]/50"
                  />
                  {searchFilter && (
                    <button
                      type="button"
                      onClick={() => setSearchFilter('')}
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
          )}
        </div>

        {/* Enhanced Audit Table */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6">
          {/* Table Header */}
          <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Registro de Auditoría</h3>
                  <p className="text-sm text-[var(--unit-text-muted)]">
                    {data?.data?.length || 0} registros encontrados
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-[var(--unit-accent)]/10 px-3 py-1 text-xs font-medium text-[var(--unit-accent)] border border-[var(--unit-accent)]/30">
                Página {page} de {totalPages}
              </span>
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="flex flex-wrap gap-4 text-xs text-[var(--unit-text-muted)] mb-6">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800 border border-green-200">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              {data?.data?.filter(row => row.action === 'CREATE').length || 0} creaciones
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              <div className="h-2 w-2 rounded-full bg-amber-500"></div>
              {data?.data?.filter(row => row.action === 'UPDATE').length || 0} actualizaciones
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-800 border border-red-200">
              <div className="h-2 w-2 rounded-full bg-red-500"></div>
              {data?.data?.filter(row => row.action === 'DELETE').length || 0} eliminaciones
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              {data?.data?.filter(row => row.action === 'LOGIN').length || 0} inicios
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              <div className="h-2 w-2 rounded-full bg-purple-500"></div>
              {recentAuditCount} recientes
            </span>
          </div>
          
          <DataTable
            columns={columns}
            data={filteredAuditData}
            keyExtractor={(row) => row.id}
            loading={isLoading}
            searchPlaceholder=""
            filters={[]}
            emptyMessage="No hay registros con los filtros aplicados."
            pageSize={30}
            pageSizeOptions={[15, 30, 50, 100]}
          />
        </div>
      </div>
    </div>
  );
}
