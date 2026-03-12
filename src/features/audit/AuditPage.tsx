'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button, Skeleton, DataTable } from '@/components/ui';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { AuditMetrics } from '@/features/audit/AuditMetrics';
import { Download, Calendar, User, Activity, Database, Fingerprint, Monitor, AlertCircle, FileText, Filter, ChevronUp, ChevronDown, Search, X, Shield, Clock, TrendingUp, Eye, Settings } from 'lucide-react';
import { downloadExcelReport } from '@/lib/excelReport';
import { downloadPdfReport } from '@/lib/pdfReport';
import { useBusinessConfig } from '@/hooks/useBusinessConfig';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import type { AuditLog, AuditResponse, AuditFilters, AuditAction } from '@/types/audit';
import { getActionLabel, formatAuditRow } from '@/types/audit';

export function AuditPage(): JSX.Element {
  const [dateFrom, setDateFrom] = useState(() => startOfDay(subDays(new Date(), 7)));
  const [dateTo, setDateTo] = useState(() => endOfDay(new Date()));
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [unitFilter, setUnitFilter] = useState('');
  const limit = 30;

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
  params.set('limit', String(limit));

  // ✅ MEJORADO: Use query with caching inteligente
  const { data, isLoading, error } = useQuery({
    queryKey: ['audit', dateFrom, dateTo, action, entity, searchFilter],
    queryFn: async (): Promise<AuditResponse> => {
      try {
        const { data: res } = await api.get<AuditResponse>(`/api/audit?${params}`);
        return res;
      } catch (err) {
        console.error('Error fetching audit data:', err);
        throw err;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });

  const exportExcel = useCallback(async () => {
    const exportParams = new URLSearchParams();
    if (dateFrom) exportParams.set('from', dateFrom.toISOString());
    if (dateTo) exportParams.set('to', dateTo.toISOString());
    if (action) exportParams.set('action', action);
    if (entity) exportParams.set('entity', entity);
    if (searchFilter) exportParams.set('search', searchFilter);
    exportParams.set('exportLimit', '5000');
    const { data: rows } = await api.get<AuditLog[]>(`/api/audit/export?${exportParams}`);
    if (!rows?.length) return;
    await downloadExcelReport(
      `auditoria-${new Date().toISOString().slice(0, 10)}.xlsx`,
      'Auditoría',
      ['Fecha', 'Usuario', 'Acción', 'Entidad', 'ID', 'IP / Dispositivo'],
      rows.map(formatAuditRow)
    );
  }, [dateFrom, dateTo, action, entity, searchFilter]);

  const exportPdf = useCallback(async () => {
    const exportParams = new URLSearchParams();
    if (dateFrom) exportParams.set('from', dateFrom.toISOString());
    if (dateTo) exportParams.set('to', dateTo.toISOString());
    if (action) exportParams.set('action', action);
    if (entity) exportParams.set('entity', entity);
    if (searchFilter) exportParams.set('search', searchFilter);
    exportParams.set('exportLimit', '5000');
    const { data: rows } = await api.get<AuditLog[]>(`/api/audit/export?${exportParams}`);
    if (!rows?.length) return;
    const fromDateStr = dateFrom ? dateFrom.toLocaleDateString('es-PE') : '…';
    const toDateStr = dateTo ? dateTo.toLocaleDateString('es-PE') : '…';
    const subtitle = [fromDateStr, toDateStr].filter(Boolean).length ? `Filtro: ${fromDateStr} a ${toDateStr}` : 'Página actual';
    downloadPdfReport(
      `auditoria-${new Date().toISOString().slice(0, 10)}.pdf`,
      'Registro de auditoría',
      subtitle,
      ['Fecha', 'Usuario', 'Acción', 'Entidad', 'ID', 'IP / Dispositivo'],
      rows.map(formatAuditRow)
    );
  }, [dateFrom, dateTo, action, entity, searchFilter]);

  // Define columns for DataTable - Estilo ServicesPage
  const columns: Array<{
    key: string;
    header: string;
    sortable: boolean;
    render: (row: unknown) => React.ReactNode;
  }> = [
    {
      key: 'createdAt',
      header: 'Fecha',
      sortable: true,
      render: (row: unknown) => {
        const auditRow = row as AuditLog;
        const date = new Date(auditRow.createdAt);
        return (
          <div className="flex flex-col gap-1">
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800">
              {date.toLocaleDateString('es-PE')}
            </span>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-800">
              {date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        );
      },
    },
    {
      key: 'userName',
      header: 'Usuario',
      sortable: true,
      render: (row: unknown) => {
        const auditRow = row as AuditLog;
        return (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-pink-100 text-pink-800">
            {auditRow.userName}
          </span>
        );
      },
    },
    {
      key: 'action',
      header: 'Acción',
      sortable: true,
      render: (row: unknown) => {
        const auditRow = row as AuditLog;
        return (
          <span className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            auditRow.action === 'LOGIN' || auditRow.action === 'LOGOUT'
              ? 'bg-blue-100 text-blue-800'
              : auditRow.action.includes('DELETE') || auditRow.action.includes('CANCEL')
              ? 'bg-red-100 text-red-800'
              : auditRow.action.includes('CREATE')
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          )}>
            {getActionLabel(auditRow.action)}
          </span>
        );
      },
    },
    {
      key: 'entity',
      header: 'Entidad',
      sortable: true,
      render: (row: unknown) => {
        const auditRow = row as AuditLog;
        return (
          <span className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            auditRow.entity === 'User' ? 'bg-purple-100 text-purple-800' :
            auditRow.entity === 'Sale' ? 'bg-emerald-100 text-emerald-800' :
            auditRow.entity === 'CashRegister' ? 'bg-amber-100 text-amber-800' :
            auditRow.entity === 'Product' ? 'bg-blue-100 text-blue-800' :
            auditRow.entity === 'Service' ? 'bg-green-100 text-green-800' :
            auditRow.entity === 'Commission' ? 'bg-orange-100 text-orange-800' :
            auditRow.entity === 'Expense' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          )}>
            {auditRow.entity}
          </span>
        );
      },
    },
    {
      key: 'entityId',
      header: 'ID',
      sortable: true,
      render: (row: unknown) => {
        const auditRow = row as AuditLog;
        return (
          <span 
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 font-mono"
            title={auditRow.entityId}
          >
            {auditRow.entityId.slice(0, 8)}...
          </span>
        );
      },
    },
    {
      key: 'device',
      header: 'IP / Dispositivo',
      sortable: true,
      render: (row: unknown) => {
        const auditRow = row as AuditLog;
        const ipDisplay = auditRow.ipAddress ? auditRow.ipAddress.split('.').slice(0, 2).join('.') + '.*' : 'Sin IP';
        return (
          <span 
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-cyan-100 text-cyan-800"
            title={`${auditRow.ipAddress || 'N/A'} - ${auditRow.device || 'N/A'}`}
          >
            {ipDisplay}
          </span>
        );
      },
    },
  ];

  // Apply filters to audit data
  const filteredAuditData = useMemo(() => {
    if (!data?.data) return [];
    return data.data;
  }, [data]);

  // ✅ CORRECCIÓN: Obtener opciones de filtros con fallback a datos actuales
  const { data: allAuditData } = useQuery({
    queryKey: ['audit-filter-options'],
    queryFn: async (): Promise<AuditResponse> => {
      const params = new URLSearchParams();
      params.set('limit', '2000'); // Más registros para opciones
      
      // Obtener datos de un rango más amplio para más opciones
      const thirtyDaysAgo = startOfDay(subDays(new Date(), 30));
      params.set('from', thirtyDaysAgo.toISOString());
      params.set('to', endOfDay(new Date()).toISOString());
      
      const { data: res } = await api.get<AuditResponse>(`/api/audit?${params}`);
      return res;
    },
    staleTime: 15 * 60 * 1000, // 15 minutos
    retry: 2,
  });

  // ✅ MEJORADO: Cache de opciones para evitar recálculos
  const filterOptions = useMemo(() => {
    // Usar datos actuales como base, enriquecer con datos históricos si disponibles
    const dataSource = data?.data || [];
    const historicalSource = allAuditData?.data || [];
    
    // Combinar datos actuales con históricos para más opciones
    const combinedData = [...dataSource, ...historicalSource];
    
    if (combinedData.length === 0) {
      return { entities: [], actions: [] };
    }
    
    const entities = [...new Set(combinedData.map(row => row.entity))]
      .filter(Boolean)
      .map(entity => ({ value: entity, label: entity }))
      .sort((a, b) => a.label.localeCompare(b.label));
    
    const actions = [...new Set(combinedData.map(row => row.action))]
      .filter(Boolean)
      .map(action => ({ value: action, label: getActionLabel(action as any) }))
      .sort((a, b) => a.label.localeCompare(b.label));
    
    return { entities, actions };
  }, [data, allAuditData]);

  // Get unique entities for filter - usar cache
  const getUniqueEntities = useCallback(() => {
    return filterOptions.entities;
  }, [filterOptions]);

  // Get unique actions for filter - usar cache
  const getUniqueActions = useCallback(() => {
    return filterOptions.actions;
  }, [filterOptions]);

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--unit-surface)] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-[var(--unit-text)] font-medium">Error al cargar datos de auditoría</p>
              <p className="text-[var(--unit-text-muted)] text-sm mt-2">
                {error instanceof Error ? error.message : 'Error desconocido'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--unit-surface)] via-[var(--unit-surface-elevated)] to-[var(--unit-surface)]">
      {/* Background Pattern - Exacto estilo ServicesPage */}
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
                Registro de Auditoría
              </span>
            </div>
            <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">Auditoría del Sistema</h1>
            <p className="text-[var(--unit-text-muted)]">
              Monitoreo completo de todas las acciones del sistema
            </p>
          </div>

          {/* Audit Metrics - Nueva sección de métricas espectaculares */}
          {data?.data && (
            <AuditMetrics 
              data={data.data} 
              dateFrom={dateFrom} 
              dateTo={dateTo} 
            />
          )}

          {/* Enhanced Action Buttons - Exacto estilo ReportsPage */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={exportExcel}
              disabled={!data?.data?.length || isLoading}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg border-2 border-emerald-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="h-5 w-5" />
              Exportar Excel
            </button>
            <button
              onClick={exportPdf}
              disabled={!data?.data?.length || isLoading}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold shadow-lg border-2 border-red-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="h-5 w-5" />
              Exportar PDF
            </button>
          </div>
        </div>

        {/* Enhanced Audit Filters - Exacto estilo ServicesPage */}
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
                showUnitFilter={true}
                showStatusFilter={false}
                className="rounded-xl"
              />

              {/* Additional Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Action Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Acción</label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                  >
                    <option value="">Todas las acciones</option>
                    {getUniqueActions().map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Entity Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Entidad</label>
                  <select
                    value={entity}
                    onChange={(e) => setEntity(e.target.value)}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                  >
                    <option value="">Todas las entidades</option>
                    {getUniqueEntities().map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
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
                      placeholder="Buscar por usuario, acción, entidad, ID, IP o dispositivo..."
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
                  <p className="text-xs text-[var(--unit-text-muted)] italic">
                    Busca en: nombre de usuario, acción, entidad, ID, dirección IP o dispositivo
                  </p>
                </div>
              </div>

              {/* Enhanced Active Filters Summary */}
              {(unitFilter || action || entity || searchFilter) && (
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
                        {action && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700 border border-sky-200">
                            Acción: {getActionLabel(action as any)}
                          </span>
                        )}
                        {entity && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 border border-purple-200">
                            Entidad: {entity}
                          </span>
                        )}
                        {searchFilter && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                            Búsqueda: {searchFilter}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setUnitFilter('');
                        setAction('');
                        setEntity('');
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

        {/* Audit Table - Exacto estilo ServicesPage */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6">
          {/* Table Header */}
          <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Registro de Auditoría</h3>
                  <p className="text-sm text-[var(--unit-text-muted)]">Historial completo de acciones del sistema</p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-[var(--unit-accent)]/20 px-3 py-1.5 text-sm font-bold text-[var(--unit-accent)] border border-[var(--unit-accent)]/30 shadow-sm">
                {data?.data?.length || 0} registros
              </span>
            </div>
          </div>

          {/* Table */}
          <DataTable
            data={filteredAuditData}
            columns={columns}
            loading={isLoading}
            keyExtractor={(row) => (row as AuditLog).id}
            emptyMessage="No se encontraron registros de auditoría con los filtros aplicados."
            className="rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}
