'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button, Skeleton, DataTable } from '@/components/ui';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { TableToolbar } from '@/components/ui/TableToolbar';
import { TableBadge } from '@/components/ui/TableBadge';
import { AuditMetrics } from './AuditMetrics';
import { Download, Calendar, User, Activity, Database, Fingerprint, Monitor, AlertCircle, FileText, FileSpreadsheet, Filter, ChevronUp, ChevronDown, Search, X } from 'lucide-react';
import { downloadExcelReport } from '@/lib/excelReport';
import { downloadPdfReport } from '@/lib/pdfReport';
import { useBusinessConfig } from '@/hooks/useBusinessConfig';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

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
  
  // Debounce hook para búsqueda
  function useDebouncedValue<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
      const t = setTimeout(() => setDebounced(value), delay);
      return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
  }
  
  const debouncedSearchFilter = useDebouncedValue(searchFilter.trim(), 300);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true);
  const limit = 30;

  // ✅ MEJORADO: Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [dateFrom, dateTo, action, entity, debouncedSearchFilter]);

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
              <p className="text-[var(--unit-text-muted)]">Loading...</p>
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
  if (debouncedSearchFilter) params.set('search', debouncedSearchFilter);
  params.set('page', String(page));
  params.set('limit', String(limit));

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit', dateFrom, dateTo, action, entity, debouncedSearchFilter, page],
    queryFn: async (): Promise<AuditResponse> => {
      try {
      const { data: res } = await api.get<AuditResponse>(`/api/audit?${params}`);
      return res;
      } catch (err) {
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
            {format(new Date(row.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
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
        <TableBadge type={
          row.action === 'LOGIN' || row.action === 'LOGOUT' ? 'role-receptionist' :
          row.action === 'CREATE' ? 'status-active' :
          row.action === 'UPDATE' ? 'status-pending' :
          row.action === 'DELETE' ? 'status-inactive' :
          'status-neutral'
        }>
          {row.action}
        </TableBadge>
      ),
    },
    {
      key: 'entity',
      header: 'Entidad',
      sortable: true,
      render: (row: AuditRow) => (
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-[var(--unit-text-muted)]" />
          <TableBadge type={
            row.entity === 'USER' ? 'role-admin' :
            row.entity === 'CLIENT' ? 'role-receptionist' :
            row.entity === 'PRODUCT' || row.entity === 'SERVICE' ? 'status-active' :
            row.entity === 'SALE' ? 'status-pending' :
            row.entity === 'APPOINTMENT' ? 'role-spa-specialist' :
            row.entity === 'CASH_REGISTER' ? 'unit-barberia' :
            'status-neutral'
          }>
            {row.entity}
          </TableBadge>
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
    <div className="min-h-screen bg-[var(--unit-surface)]">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Top Header & Fast Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--unit-border)]/40 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] text-xs font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--unit-accent)] animate-pulse" />
                Seguridad & Trazabilidad
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--unit-text)] tracking-tight">
              Registro de Auditoría & Logs
            </h1>
            <p className="text-xs sm:text-sm text-[var(--unit-text-muted)]">
              Trazabilidad en tiempo real de operaciones sensibles, inicios de sesión y modificaciones de datos
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={exportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-xs font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-all shadow-unit-sm"
              title="Exportar a Excel"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>Exportar Excel</span>
            </button>

            <button
              type="button"
              onClick={exportPdf}
              disabled={!data?.data?.length}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-xs font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-all shadow-unit-sm disabled:opacity-50"
              title="Exportar a PDF"
            >
              <FileText className="h-4 w-4 text-rose-600" />
              <span>Exportar PDF</span>
            </button>
          </div>
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

        {/* Enhanced Audit Filters */}
        <div className="mb-8">
          <TableToolbar
            search={searchFilter}
            onSearchChange={setSearchFilter}
            searchPlaceholder="Buscar en auditoría (usuario, acción, entidad, IP...)"
            chips={[
              { id: '', label: 'Todas las acciones', count: data?.data?.length || 0 },
              { id: 'CREATE', label: 'Creaciones', activeColor: 'bg-emerald-600 text-white' },
              { id: 'UPDATE', label: 'Actualizaciones', activeColor: 'bg-amber-500 text-white' },
              { id: 'DELETE', label: 'Eliminaciones', activeColor: 'bg-red-600 text-white' },
              { id: 'LOGIN', label: 'Inicios de sesión', activeColor: 'bg-blue-600 text-white' },
            ]}
            activeChip={action}
            onChipChange={(id) => setAction(String(id))}
            showAdvancedFiltersButton={true}
            isAdvancedOpen={showFilters}
            onToggleAdvanced={() => setShowFilters(!showFilters)}
            activeFiltersCount={(action ? 1 : 0) + (entity ? 1 : 0) + (searchFilter ? 1 : 0)}
            onResetFilters={() => {
              setAction('');
              setEntity('');
              setSearchFilter('');
              setDateFrom(startOfDay(subDays(new Date(), 7)));
              setDateTo(endOfDay(new Date()));
            }}
            advancedFiltersContent={
              <div className="space-y-6">
                <DateRangeFilter
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                  onDateFromChange={(date: Date | null) => date && setDateFrom(date)}
                  onDateToChange={(date: Date | null) => date && setDateTo(date)}
                  showUnitFilter={false}
                  showStatusFilter={false}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Acción (Manual)</label>
                    <select
                      value={action}
                      onChange={(e) => setAction(e.target.value)}
                      className="w-full rounded-unit border border-[var(--unit-border)]/60 bg-[var(--unit-surface-elevated)] px-4 py-2.5 text-sm text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all cursor-pointer"
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
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Entidad</label>
                    <select
                      value={entity}
                      onChange={(e) => setEntity(e.target.value)}
                      className="w-full rounded-unit border border-[var(--unit-border)]/60 bg-[var(--unit-surface-elevated)] px-4 py-2.5 text-sm text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all cursor-pointer"
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
              </div>
            }
          />
        </div>

        {/* Enhanced Audit Table */}
        <div className="relative overflow-hidden rounded-unit-lg border border-[var(--unit-border)]/60 bg-[var(--unit-surface)] shadow-unit p-6">
          {/* Table Header */}
          <div className="bg-[var(--unit-surface-elevated)] px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-unit bg-[var(--unit-accent)] text-white shadow-unit">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Registro de Auditoría</h3>
                  <p className="text-sm text-[var(--unit-text-muted)]">
                    {data?.data?.length || 0} registros encontrados
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-[var(--unit-accent)]/15 px-3 py-1 text-xs font-medium text-[var(--unit-accent)] border border-[var(--unit-accent)]/30">
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
