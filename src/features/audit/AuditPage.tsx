'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button, Skeleton, DataTable, TableToolbar, TableBadge, DateRangeFilter } from '@/components/ui';
import { AuditMetrics } from '@/features/audit/AuditMetrics';
import { Download, Calendar, User, Activity, Database, Fingerprint, Monitor, AlertCircle, FileText, Filter, ChevronUp, ChevronDown, Search, X, Shield, Clock, TrendingUp, Eye, Settings, DollarSign } from 'lucide-react';
import { downloadExcelReport } from '@/lib/excelReport';
import { downloadPdfReport } from '@/lib/pdfReport';
import { useBusinessConfig } from '@/hooks/useBusinessConfig';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import type { AuditLog, AuditResponse, AuditFilters, AuditAction } from '@/types/audit';
import { getActionLabel, getEntityLabel, formatAuditRow } from '@/types/audit';

export function AuditPage(): JSX.Element {
  const [dateFrom, setDateFrom] = useState(() => startOfDay(subDays(new Date(), 7)));
  const [dateTo, setDateTo] = useState(() => endOfDay(new Date()));
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
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

  // Define columns for DataTable
  const columns: Array<{
    key: string;
    header: string;
    sortable: boolean;
    align?: 'left' | 'center' | 'right';
    render: (row: unknown) => React.ReactNode;
  }> = [
    {
      key: 'createdAt',
      header: 'Fecha / Hora',
      sortable: true,
      align: 'left',
      render: (row: unknown) => {
        const auditRow = row as AuditLog;
        const date = new Date(auditRow.createdAt);
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-[var(--unit-text)]">
              {date.toLocaleDateString('es-PE')}
            </span>
            <span className="text-[11px] font-mono text-[var(--unit-text-muted)]">
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
      align: 'left',
      render: (row: unknown) => {
        const auditRow = row as AuditLog;
        return (
          <TableBadge type="user-name">
            {auditRow.userName}
          </TableBadge>
        );
      },
    },
    {
      key: 'action',
      header: 'Acción',
      sortable: true,
      align: 'center',
      render: (row: unknown) => {
        const auditRow = row as AuditLog;
        const actionType = 
          auditRow.action === 'LOGIN' ? 'action-login' :
          auditRow.action === 'LOGOUT' ? 'action-logout' :
          auditRow.action.includes('CREATE') ? 'action-create' :
          auditRow.action.includes('DELETE') ? 'action-delete' :
          auditRow.action.includes('CANCEL') ? 'action-cancel' :
          'action-update';
        return (
          <TableBadge type={actionType}>
            {getActionLabel(auditRow.action)}
          </TableBadge>
        );
      },
    },
    {
      key: 'entity',
      header: 'Entidad',
      sortable: true,
      align: 'center',
      render: (row: unknown) => {
        const auditRow = row as AuditLog;
        const entityType = 
          auditRow.entity === 'User' ? 'entity-user' :
          auditRow.entity === 'Sale' ? 'entity-sale' :
          auditRow.entity === 'CashRegister' ? 'entity-cash-register' :
          auditRow.entity === 'Product' ? 'entity-product' :
          auditRow.entity === 'Service' ? 'entity-service' :
          auditRow.entity === 'Commission' ? 'entity-commission' :
          auditRow.entity === 'Expense' ? 'entity-expense' :
          'status-neutral';
        return (
          <TableBadge type={entityType}>
            {getEntityLabel(auditRow.entity)}
          </TableBadge>
        );
      },
    },
    {
      key: 'entityId',
      header: 'ID',
      sortable: true,
      align: 'center',
      render: (row: unknown) => {
        const auditRow = row as AuditLog;
        return (
          <TableBadge type="id" mono>
            {auditRow.entityId.slice(0, 8)}...
          </TableBadge>
        );
      },
    },
    {
      key: 'device',
      header: 'IP / Dispositivo',
      sortable: true,
      align: 'center',
      render: (row: unknown) => {
        const auditRow = row as AuditLog;
        const ipDisplay = auditRow.ipAddress ? auditRow.ipAddress.split('.').slice(0, 2).join('.') + '.*' : 'Sin IP';
        return (
          <TableBadge type="ip" mono>
            {ipDisplay}
          </TableBadge>
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
      .map(entity => ({ value: entity, label: getEntityLabel(entity) }))
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
                Por favor intenta recargar la página
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
            <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-unit">Auditoría del Sistema</h1>
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
        </div>

        {/* Unified TableToolbar */}
        <TableToolbar
          search={searchFilter}
          onSearchChange={setSearchFilter}
          searchPlaceholder="Buscar por usuario, acción, entidad, ID, IP o dispositivo..."
          chips={[
            { id: '', label: 'Todas las entidades' },
            { id: 'Sale', label: 'Ventas', icon: <DollarSign className="h-3 w-3" /> },
            { id: 'CashRegister', label: 'Caja', icon: <Database className="h-3 w-3" /> },
            { id: 'User', label: 'Usuarios', icon: <User className="h-3 w-3" /> },
            { id: 'Service', label: 'Servicios', icon: <Activity className="h-3 w-3" /> },
            { id: 'Expense', label: 'Gastos', icon: <TrendingUp className="h-3 w-3" /> },
          ]}
          activeChip={entity}
          onChipChange={(id) => setEntity(String(id))}
          showAdvancedFiltersButton={true}
          isAdvancedOpen={showFilters}
          onToggleAdvanced={() => setShowFilters(!showFilters)}
          activeFiltersCount={(entity ? 1 : 0) + (action ? 1 : 0) + (unitFilter ? 1 : 0) + (searchFilter ? 1 : 0)}
          onResetFilters={() => {
            setUnitFilter('');
            setAction('');
            setEntity('');
            setSearchFilter('');
            setDateFrom(startOfDay(subDays(new Date(), 7)));
            setDateTo(endOfDay(new Date()));
          }}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={exportExcel}
                disabled={!data?.data?.length || isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-unit bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Excel</span>
              </button>
              <button
                onClick={exportPdf}
                disabled={!data?.data?.length || isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-unit bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                <span>PDF</span>
              </button>
            </div>
          }
          advancedFiltersContent={
            <div className="space-y-4">
              <DateRangeFilter
                compact={true}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={(date: Date | null) => date && setDateFrom(date)}
                onDateToChange={(date: Date | null) => date && setDateTo(date)}
                unit={unitFilter}
                onUnitChange={setUnitFilter}
                showUnitFilter={true}
                showStatusFilter={false}
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--unit-border)]/30">
                <div>
                  <label className="block text-xs font-bold text-[var(--unit-text)] mb-1">Acción Específica</label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="w-full h-9 rounded-unit border border-[var(--unit-border)]/60 px-3 text-xs text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] focus:outline-none focus:border-[var(--unit-accent)]"
                  >
                    <option value="">Todas las acciones</option>
                    {getUniqueActions().map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--unit-text)] mb-1">Entidad del Sistema</label>
                  <select
                    value={entity}
                    onChange={(e) => setEntity(e.target.value)}
                    className="w-full h-9 rounded-unit border border-[var(--unit-border)]/60 px-3 text-xs text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] focus:outline-none focus:border-[var(--unit-accent)]"
                  >
                    <option value="">Todas las entidades</option>
                    {getUniqueEntities().map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          }
        />

        {/* Audit DataTable Container */}
        <div className="mt-4">
          <DataTable
            data={filteredAuditData}
            columns={columns}
            loading={isLoading}
            keyExtractor={(row) => (row as AuditLog).id}
            emptyMessage="No se encontraron registros de auditoría con los filtros aplicados."
            pageSize={20}
            pageSizeOptions={[10, 20, 30, 50, 100]}
            onResetFilters={() => {
              setUnitFilter('');
              setAction('');
              setEntity('');
              setSearchFilter('');
            }}
          />
        </div>
      </div>
    </div>
  );
}
