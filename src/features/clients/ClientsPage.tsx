'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus, Phone, CreditCard, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Filter, Users, TrendingUp, AlertCircle, Calendar, Star, Sparkles, Plus, Lock, Unlock, X, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { Drawer, Badge, Skeleton } from '@/components/ui';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { ClientModals } from './ClientModals';
import { ClientsMetrics } from './ClientsMetrics';
import type { Client } from '../../types/client';
import { formatDistanceToNow, startOfDay, endOfDay, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { downloadExcelReport } from '@/lib/excelReport';
import { downloadPdfReport } from '@/lib/pdfReport';
import { useBusinessConfig } from '@/hooks/useBusinessConfig';

interface ListResponse {
  data: Client[];
  total: number;
}

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [creditFilter, setCreditFilter] = useState<'all' | 'hasCredit' | 'noCredit'>('all');
  const [drawerClient, setDrawerClient] = useState<Client | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  
  // Date range filter states
  const [dateFrom, setDateFrom] = useState<Date>(startOfDay(subDays(new Date(), 7)));
  const [dateTo, setDateTo] = useState<Date>(endOfDay(new Date()));
  
  // Modal states (passed to ClientModals)
  const [creditModal, setCreditModal] = useState(false);
  const [blockModal, setBlockModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const queryClient = useQueryClient();

  // ✅ NUEVO: Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, creditFilter, dateFrom, dateTo]);

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search, page, statusFilter, creditFilter, dateFrom, dateTo],
    queryFn: async (): Promise<ListResponse> => {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      params.set('page', String(page));
      params.set('limit', '20');
      
      // ✅ NUEVO: Aplicar filtros al backend
      if (statusFilter !== 'all') {
        params.set('isBlocked', statusFilter === 'blocked' ? 'true' : 'false');
      }
      
      // ✅ NUEVO: Agregar filtros de fecha
      if (dateFrom) {
        params.set('dateFrom', dateFrom.toISOString());
      }
      if (dateTo) {
        params.set('dateTo', dateTo.toISOString());
      }
      
      const { data: res } = await api.get<ListResponse>(`/api/clients?${params}`);
      return res;
    },
    // ✅ OPTIMIZACIÓN: Cache mejorado para mejor performance
    staleTime: 5 * 60 * 1000, // 5 minutos en lugar de 30 segundos
    gcTime: 10 * 60 * 1000, // 10 minutos garbage collection
    refetchOnWindowFocus: false, // No refetch al cambiar de ventana
    refetchOnReconnect: true, // Refetch al reconectar
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });

  const openDrawer = useCallback((c: Client) => setDrawerClient(c), []);
  const closeDrawer = useCallback(() => setDrawerClient(null), []);

  // Computed metrics
  const metrics = useMemo(() => {
    if (!data?.data) return { total: 0, active: 0, blocked: 0, totalCredit: 0 };
    
    const clients = data.data;
    return {
      total: clients.length,
      active: clients.filter(c => !c.isBlocked).length,
      blocked: clients.filter(c => c.isBlocked).length,
      totalCredit: clients.reduce((sum, c) => sum + Number(c.creditBalance), 0),
    };
  }, [data?.data]);

  // Filtered clients (no sorting needed)
  const filteredAndSortedClients = useMemo(() => {
    if (!data?.data) return [];
    
    let clients = data.data;
    
    // Apply date filter FIRST
    if (dateFrom || dateTo) {
      clients = clients.filter(c => {
        if (!c.createdAt) return true; // Include clients without createdAt
        
        const clientDate = new Date(c.createdAt);
        const from = dateFrom ? startOfDay(dateFrom) : null;
        const to = dateTo ? endOfDay(dateTo) : null;
        
        if (from && clientDate < from) return false;
        if (to && clientDate > to) return false;
        
        return true;
      });
    }
    
    // Apply filters
    if (statusFilter !== 'all') {
      clients = clients.filter(c => 
        statusFilter === 'active' ? !c.isBlocked : c.isBlocked
      );
    }
    
    if (creditFilter !== 'all') {
      clients = clients.filter(c => 
        creditFilter === 'hasCredit' ? Number(c.creditBalance) > 0 : Number(c.creditBalance) === 0
      );
    }
    
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      clients = clients.filter(c =>
        c.name.toLowerCase().includes(searchLower) ||
        c.phone.toLowerCase().includes(searchLower) ||
        (c.freeNotes && c.freeNotes.toLowerCase().includes(searchLower)) ||
        (c.usualProducts && c.usualProducts.toLowerCase().includes(searchLower))
      );
    }
    
    return clients;
  }, [data?.data, statusFilter, creditFilter, search, dateFrom, dateTo]);

  // Paginated clients for display
  const paginatedClients = useMemo(() => {
    const startIndex = (page - 1) * 20;
    const endIndex = startIndex + 20;
    return filteredAndSortedClients.slice(startIndex, endIndex);
  }, [filteredAndSortedClients, page]);

  // Helper functions
  const isRecentClient = (createdAt?: string) => {
    if (!createdAt) return false;
    const createdDate = new Date(createdAt);
    const daysDiff = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7; // Clients created in last 7 days
  };

  const isVipClient = (totalVisits?: number) => {
    return totalVisits && totalVisits > 10;
  };

  const handleQuickCredit = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    setSelectedClient(client);
    setCreditModal(true);
  };

  const handleToggleBlock = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    setSelectedClient(client);
    setBlockModal(true);
  };

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
                Sistema de Clientes
              </span>
            </div>
            <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">Clientes</h1>
            <p className="text-[var(--unit-text-muted)]">
              Gestiona clientes y su información de contacto
            </p>
          </div>

          {/* Clients Metrics */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--unit-accent)]" />
              <span className="ml-2 text-[var(--unit-text)]">Cargando métricas...</span>
            </div>
          ) : (
            <ClientsMetrics clients={data?.data || []} />
          )}
        </div>

        {/* Enhanced Clients Filters */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6 mb-8">
          {/* Filter Header */}
          <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Filtros de Clientes</h3>
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
                unit=""
                onUnitChange={() => {}}
                showUnitFilter={false}
                showStatusFilter={false}
                className="rounded-xl"
              />

              {/* Additional Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Estado</label>
                  <select
                    value={statusFilter}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'blocked')}
                  >
                    <option value="all">Todos los estados</option>
                    <option value="active">Activos</option>
                    <option value="blocked">Bloqueados</option>
                  </select>
                </div>

                {/* Credit Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Crédito</label>
                  <select
                    value={creditFilter}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                    onChange={(e) => setCreditFilter(e.target.value as 'all' | 'hasCredit' | 'noCredit')}
                  >
                    <option value="all">Todos los créditos</option>
                    <option value="hasCredit">Con crédito</option>
                    <option value="noCredit">Sin crédito</option>
                  </select>
                </div>

                {/* Search Placeholder */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Búsqueda</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-[var(--unit-text-muted)]" />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar por nombre, teléfono..."
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
              {(statusFilter !== 'all' || creditFilter !== 'all' || search) && (
                <div className="rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Filtros activos:</span>
                      <div className="flex flex-wrap gap-2">
                        {statusFilter !== 'all' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-200">
                            Estado: {statusFilter === 'active' ? 'Activos' : 'Bloqueados'}
                          </span>
                        )}
                        {creditFilter !== 'all' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 border border-purple-200">
                            Crédito: {creditFilter === 'hasCredit' ? 'Con crédito' : 'Sin crédito'}
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
                        setStatusFilter('all');
                        setCreditFilter('all');
                        setSearch('');
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

        {/* Client Cards */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-[var(--unit-border-radius)]" />
            ))}
          </div>
        ) : paginatedClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[var(--unit-border-radius)] border border-[var(--unit-border)] bg-[var(--unit-surface-elevated)] py-16">
            <UserPlus className="mb-3 h-10 w-10 text-[var(--unit-text)]" />
            <p className="text-sm text-[var(--unit-text)]">
              {search || statusFilter !== 'all' || creditFilter !== 'all' 
                ? 'No hay clientes que coincidan con los filtros.' 
                : 'No hay clientes. Crea uno nuevo.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {paginatedClients.map((c: Client) => (
              <button
                key={c.id}
                type="button"
                onClick={() => openDrawer(c)}
                className="group relative flex w-full items-start gap-4 rounded-[var(--unit-border-radius)] border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-4 sm:p-5 text-left transition-all duration-300 hover:shadow-[var(--unit-shadow-lg)] hover:scale-[1.01] hover:border-[var(--unit-accent)]/50 active:scale-[0.99]"
              >
                {/* Background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[var(--unit-border-radius)]"></div>
                
                {/* VIP/New Badge */}
                {(isVipClient(c._count?.appointments)) && (
                  <div className="absolute top-3 right-3 z-10">
                    <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500/30 to-amber-600/20 px-3 py-1 text-[10px] font-bold text-amber-700 border border-amber-500/40 shadow-sm">
                      <Star className="h-3 w-3 flex-shrink-0" />
                      VIP
                    </span>
                  </div>
                )}

                {/* Avatar with Status */}
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] text-lg font-bold text-white border-2 border-[var(--unit-surface)] shadow-lg group-hover:scale-110 transition-transform">
                  {c.name.charAt(0).toUpperCase()}
                  <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-[var(--unit-surface)] shadow-sm ${
                    c.isBlocked ? 'bg-red-500' : 'bg-emerald-500'
                  }`} />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <p className="text-base font-bold text-[var(--unit-text)] truncate group-hover:text-[var(--unit-accent)] transition-colors">{c.name}</p>
                      {c.isBlocked && <Badge variant="danger" className="text-xs font-semibold">Bloqueado</Badge>}
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-[var(--unit-text-muted)] transition-all duration-300 group-hover:translate-x-1 group-hover:text-[var(--unit-accent)]" />
                  </div>
                  
                  {/* Contact Info */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-[var(--unit-text-muted)]">
                    <span className="inline-flex items-center gap-2 px-2 py-1 bg-[var(--unit-surface)]/50 rounded-lg border border-[var(--unit-border)]/30">
                      <Phone className="h-4 w-4 text-[var(--unit-accent)]" />
                      {c.phone}
                    </span>
                    <span className="inline-flex items-center gap-2 px-2 py-1 bg-[var(--unit-surface)]/50 rounded-lg border border-[var(--unit-border)]/30">
                      <CreditCard className="h-4 w-4 text-purple-500" />
                      <span className="font-semibold">S/ {Number(c.creditBalance).toFixed(2)}</span>
                    </span>
                    {c.gender && <span className="px-2 py-1 bg-[var(--unit-primary)]/10 text-[var(--unit-primary)] rounded-md text-xs font-medium">{c.gender}</span>}
                  </div>
                  
                  {/* Activity Info */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-[var(--unit-text-muted)]">
                    {(c as any).lastVisit && (
                      <span className="inline-flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-[var(--unit-accent)]" />
                        Última: {formatDistanceToNow(new Date((c as any).lastVisit), { locale: es, addSuffix: true })}
                      </span>
                    )}
                    {c._count?.appointments && (
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {c._count.appointments} {c._count.appointments === 1 ? 'visita' : 'visitas'}
                      </span>
                    )}
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="mt-3 flex items-center gap-2">
                    <div
                      onClick={(e) => handleQuickCredit(e, c)}
                      className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-medium shadow-[var(--unit-shadow)] transition-all hover:shadow-lg hover:from-purple-600 hover:to-purple-700 active:scale-[0.98] cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      Crédito
                    </div>
                    
                    <div
                      onClick={(e) => handleToggleBlock(e, c)}
                      className={`inline-flex items-center gap-1 px-5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                        c.isBlocked 
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-[var(--unit-shadow)] hover:from-green-600 hover:to-green-700 active:scale-[0.98]' 
                          : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-[var(--unit-shadow)] hover:from-red-600 hover:to-red-700 active:scale-[0.98]'
                      }`}
                    >
                      {c.isBlocked ? (
                        <>
                          <Unlock className="h-3 w-3" />
                          Desbloquear
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3" />
                          Bloquear
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Enhanced Pagination */}
        {filteredAndSortedClients.length > 0 && (
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 text-sm text-[var(--unit-text-muted)]">
              <span className="px-3 py-1 bg-[var(--unit-surface-elevated)] rounded-lg border border-[var(--unit-border)]/30 font-medium">
                Mostrando {((page - 1) * 20) + 1}-{Math.min(page * 20, filteredAndSortedClients.length)} de {filteredAndSortedClients.length}
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline px-3 py-1 bg-[var(--unit-primary)]/10 text-[var(--unit-primary)] rounded-lg font-medium">
                Página {page} de {Math.ceil(filteredAndSortedClients.length / 20) || 1}
              </span>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-2">
              {/* Previous Button */}
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-r from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] px-4 py-2 text-sm font-bold text-[var(--unit-text)] transition-all duration-300 hover:border-[var(--unit-accent)]/50 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {(() => {
                  const totalPages = Math.ceil(filteredAndSortedClients.length / 20);
                  const pages = [];
                  
                  // Always show first page
                  if (totalPages > 0) {
                    pages.push(1);
                  }
                  
                  // Show pages around current page
                  const startPage = Math.max(2, page - 2);
                  const endPage = Math.min(totalPages - 1, page + 2);
                  
                  // Add ellipsis if needed
                  if (startPage > 2) {
                    pages.push('...');
                  }
                  
                  // Add middle pages
                  for (let i = startPage; i <= endPage; i++) {
                    if (i > 1 && i < totalPages) {
                      pages.push(i);
                    }
                  }
                  
                  // Add ellipsis if needed
                  if (endPage < totalPages - 1) {
                    pages.push('...');
                  }
                  
                  // Always show last page
                  if (totalPages > 1) {
                    pages.push(totalPages);
                  }
                  
                  return pages.map((pageNum, index) => (
                    pageNum === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-3 py-1 text-sm text-[var(--unit-text-muted)] font-medium">...</span>
                    ) : (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setPage(Number(pageNum))}
                        className={`px-3 py-1 text-sm font-bold rounded-xl transition-all duration-300 ${
                          page === Number(pageNum)
                            ? 'bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white shadow-lg scale-110'
                            : 'border-2 border-[var(--unit-border)]/30 bg-[var(--unit-surface)] text-[var(--unit-text)] hover:border-[var(--unit-accent)]/50 hover:shadow-md'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  ));
                })()}
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 20 >= filteredAndSortedClients.length}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-r from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] px-4 py-2 text-sm font-bold text-[var(--unit-text)] transition-all duration-300 hover:border-[var(--unit-accent)]/50 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Jump to Page */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--unit-text-muted)] font-medium">Ir a:</span>
              <input
                type="number"
                min="1"
                max={Math.ceil(filteredAndSortedClients.length / 20)}
                value={page}
                onChange={(e) => {
                  const newPage = parseInt(e.target.value);
                  if (!isNaN(newPage) && newPage >= 1 && newPage <= Math.ceil(filteredAndSortedClients.length / 20)) {
                    setPage(newPage);
                  }
                }}
                className="w-20 rounded-xl border-2 border-[var(--unit-border)]/30 bg-[var(--unit-surface)] px-3 py-2 text-center text-sm font-bold text-[var(--unit-text)] transition-all focus:border-[var(--unit-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/20"
              />
            </div>
          </div>
        )}

        {/* Enhanced Drawer */}
        <Drawer
          open={drawerClient != null}
          onClose={closeDrawer}
          title=""
          width="md"
        >
          {drawerClient && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="relative">
                {/* Background Gradient */}
                <div className="absolute inset-0 h-32 bg-[var(--unit-accent)] rounded-t-[var(--unit-border-radius)]" />
                
                {/* Avatar and Basic Info */}
                <div className="relative flex flex-col items-center pt-8 pb-6">
                  {/* Avatar with Status */}
                  <div className="relative mb-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[var(--unit-surface)] via-[var(--unit-surface-elevated)] to-[var(--unit-surface)] text-2xl font-bold text-[var(--unit-accent)] border-4 border-[var(--unit-accent)] shadow-2xl ring-4 ring-[var(--unit-accent)]/20">
                      {drawerClient.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-3 border-[var(--unit-surface)] shadow-md ${
                      drawerClient.isBlocked ? 'bg-red-500' : 'bg-emerald-500'
                    }`} />
                  </div>
                  
                  {/* VIP/New Badges */}
                  <div className="flex gap-2 mb-3" style={{ marginTop: '10px' }}>
                    {isVipClient(drawerClient._count?.appointments) && (
                      <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/10 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-500/30">
                        <Star className="h-3 w-3 flex-shrink-0" />
                        VIP
                      </span>
                    )}
                    {isRecentClient(drawerClient.createdAt) && (
                      <span className="inline-flex items-center gap-3 rounded-full bg-[var(--unit-surface)] px-4 py-1 text-xs font-semibold text-[var(--unit-accent)] border border-[var(--unit-accent)]">
                        <Sparkles className="h-3 w-3 flex-shrink-0" />
                        Nuevo
                      </span>
                    )}
                  </div>
                  
                  {/* Name and Contact */}
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg ">{drawerClient.name}</h2>
                    <div className="flex items-center justify-center gap-6 text-sm">
                      <span className="inline-flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                        <Phone className="h-4 w-4 text-[var(--unit-text)]" />
                        <span className="text-[var(--unit-text)] font-medium">{drawerClient.phone}</span>
                      </span>
                      {drawerClient.gender && (
                        <span className="inline-flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                          <Users className="h-4 w-4 text-[var(--unit-text)]" />
                          <span className="text-[var(--unit-text)] font-medium">{drawerClient.gender}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Stats Dashboard */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Credit Card - Enhanced */}
                <div className="relative overflow-hidden rounded-[var(--unit-border-radius)] border-2 border-purple-500/30 bg-gradient-to-br from-purple-50 to-purple-100 p-6 hover:shadow-lg transition-all duration-300 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-purple-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-[var(--unit-border-radius)]"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-purple-600 shadow-lg group-hover:scale-110 transition-transform">
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-xs font-bold text-purple-800 bg-white px-3 py-1 rounded-full border border-purple-300 shadow-sm">CRÉDITO</span>
                    </div>
                    <p className="text-3xl font-bold text-purple-900 tabular-nums mb-2">S/ {Number(drawerClient.creditBalance).toFixed(2)}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-purple-700 font-medium">Saldo disponible</p>
                      {Number(drawerClient.creditBalance) > 0 && (
                        <span className="text-xs text-purple-800 bg-purple-200 px-2 py-1 rounded-full font-medium">
                          Activo
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Card - Enhanced */}
                <div className={`relative overflow-hidden rounded-[var(--unit-border-radius)] border-2 ${
                  drawerClient.isBlocked 
                    ? 'border-red-500/30 bg-gradient-to-br from-red-50 to-red-100' 
                    : 'border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-emerald-100'
                } p-6 hover:shadow-lg transition-all duration-300 group`}>
                  <div className={`absolute inset-0 bg-gradient-to-r ${
                    drawerClient.isBlocked 
                      ? 'from-red-100/50 to-red-200/50' 
                      : 'from-emerald-100/50 to-emerald-200/50'
                  } opacity-0 group-hover:opacity-100 transition-opacity rounded-[var(--unit-border-radius)]`}></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                        drawerClient.isBlocked 
                          ? 'bg-gradient-to-br from-red-500 to-red-600 border-2 border-red-600' 
                          : 'bg-gradient-to-br from-emerald-500 to-emerald-600 border-2 border-emerald-600'
                      } shadow-lg group-hover:scale-110 transition-transform`}>
                        {drawerClient.isBlocked ? (
                          <Lock className="h-6 w-6 text-white" />
                        ) : (
                          <Unlock className="h-6 w-4 text-white" />
                        )}
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-sm ${
                        drawerClient.isBlocked 
                          ? 'bg-white text-red-800 border border-red-300' 
                          : 'bg-white text-emerald-800 border border-emerald-300'
                      }`}>
                        {drawerClient.isBlocked ? 'BLOQUEADO' : 'ACTIVO'}
                      </span>
                    </div>
                    <p className={`text-3xl font-bold tabular-nums mb-2 ${
                      drawerClient.isBlocked ? 'text-red-900' : 'text-emerald-900'
                    }`}>
                      {drawerClient.isBlocked ? 'Inactivo' : 'Activo'}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${
                        drawerClient.isBlocked ? 'text-red-700' : 'text-emerald-700'
                      }`}>
                        Estado del cliente
                      </p>
                      <div className={`w-2 h-2 rounded-full ${
                        drawerClient.isBlocked ? 'bg-red-500' : 'bg-emerald-500'
                      } animate-pulse`}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary Stats - Enhanced */}
              {drawerClient._count != null && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                  {/* Appointments Card - Enhanced */}
                  <div className="relative overflow-hidden rounded-[var(--unit-border-radius)] border-2 border-[var(--unit-primary)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-primary)]/10 to-[var(--unit-accent)]/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-[var(--unit-border-radius)]"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-primary)] to-[var(--unit-accent)] border-2 border-[var(--unit-accent)] shadow-lg group-hover:scale-110 transition-transform">
                          <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xs font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-full border border-[var(--unit-border)] shadow-sm">CITAS</span>
                      </div>
                      <p className="text-3xl font-bold text-[var(--unit-text)] tabular-nums mb-2">{drawerClient._count.appointments}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-[var(--unit-text-muted)] font-medium">
                          {drawerClient._count.appointments === 1 ? 'Cita total' : 'Citas totales'}
                        </p>
                        {drawerClient._count.appointments > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="w-8 h-2 bg-[var(--unit-border)] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[var(--unit-accent)] rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, drawerClient._count.appointments * 10)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-[var(--unit-text)] font-medium">
                              {Math.min(100, drawerClient._count.appointments * 10)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sales Card - Enhanced */}
                  <div className="relative overflow-hidden rounded-[var(--unit-border-radius)] border-2 border-[var(--unit-accent)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-[var(--unit-border-radius)]"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] border-2 border-[var(--unit-primary)] shadow-lg group-hover:scale-110 transition-transform">
                          <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xs font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-full border border-[var(--unit-border)] shadow-sm">VENTAS</span>
                      </div>
                      <p className="text-3xl font-bold text-[var(--unit-text)] tabular-nums mb-2">{drawerClient._count.sales}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-[var(--unit-text-muted)] font-medium">
                          {drawerClient._count.sales === 1 ? 'Venta total' : 'Ventas totales'}
                        </p>
                        {drawerClient._count.sales > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="w-8 h-2 bg-[var(--unit-border)] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[var(--unit-accent)] rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, drawerClient._count.sales * 15)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-[var(--unit-text)] font-medium">
                              {Math.min(100, drawerClient._count.sales * 15)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Insights Card */}
              <div className="mt-6 rounded-[var(--unit-border-radius)] border-2 border-[var(--unit-border)] bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[var(--unit-text)]">Resumen del Cliente</h3>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-primary)]/20 to-[var(--unit-accent)]/20">
                    <Users className="h-4 w-4 text-[var(--unit-primary)]" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-[var(--unit-text)] tabular-nums">
                      {drawerClient._count?.appointments || 0}
                    </p>
                    <p className="text-xs text-[var(--unit-text-muted)] font-medium">Visitas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--unit-text)] tabular-nums">
                      {drawerClient._count?.sales || 0}
                    </p>
                    <p className="text-xs text-[var(--unit-text-muted)] font-medium">Compras</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--unit-accent)] tabular-nums">
                      {drawerClient._count?.appointments && drawerClient._count?.sales > 0 
                        ? Math.round((drawerClient._count.sales / drawerClient._count.appointments) * 100) / 100 
                        : 0}
                    </p>
                    <p className="text-xs text-[var(--unit-text-muted)] font-medium">Ticket Promedio</p>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-4">
                <div className="rounded-[var(--unit-border-radius)] border-2 border-[var(--unit-border)] bg-[var(--unit-surface-elevated)] p-4">
                  <h3 className="text-sm font-semibold text-[var(--unit-text-muted)] mb-3">Información Adicional</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--unit-text-muted)]">Cliente desde:</span>
                      <span className="text-[var(--unit-text-muted)] font-medium">
                        {new Date(drawerClient.createdAt).toLocaleDateString('es-PE', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                    {(drawerClient as any).lastVisit && (
                      <div className="flex justify-between">
                        <span className="text-[var(--unit-text-muted)]">Última visita:</span>
                        <span className="text-[var(--unit-text-muted)] font-medium">
                          {formatDistanceToNow(new Date((drawerClient as any).lastVisit), { 
                            locale: es, 
                            addSuffix: true 
                          })}
                        </span>
                      </div>
                    )}
                    {drawerClient.howFoundUs && (
                      <div className="flex justify-between">
                        <span className="text-[var(--unit-text-muted)]">Cómo nos conoció:</span>
                        <span className="text-[var(--unit-text-muted)] font-medium">{drawerClient.howFoundUs}</span>
                      </div>
                    )}
                    {drawerClient.preferredEmployeeId && (
                      <div className="flex justify-between">
                        <span className="text-[var(--unit-text-muted)]">Empleado preferido:</span>
                        <span className="text-[var(--unit-text-muted)] font-medium">ID: {drawerClient.preferredEmployeeId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {(drawerClient.preferenceNotes || drawerClient.freeNotes) && (
                  <div className="rounded-[var(--unit-border-radius)] border-2 border-[var(--unit-border)] bg-[var(--unit-surface-elevated)] p-4">
                    <h3 className="text-sm font-semibold text-[var(--unit-text-muted)] mb-3">Notas</h3>
                    <div className="space-y-2 text-sm">
                      {drawerClient.preferenceNotes && (
                        <div>
                          <p className="text-[var(--unit-text-muted)] text-xs mb-1">Preferencias:</p>
                          <p className="text-[var(--unit-text-muted)]">{drawerClient.preferenceNotes}</p>
                        </div>
                      )}
                      {drawerClient.freeNotes && (
                        <div>
                          <p className="text-[var(--unit-text-muted)] text-xs mb-1">Notas adicionales:</p>
                          <p className="text-[var(--unit-text-muted)]">{drawerClient.freeNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-4 pt-6 border-t border-[var(--unit-border)]/50">
                <Link
                  href={`/clients/${drawerClient.id}`}
                  onClick={closeDrawer}
                  className="inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] px-6 py-3.5 text-sm font-bold text-white shadow-lg border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02] hover:from-[var(--unit-accent)]/90 hover:to-[var(--unit-primary)]/90 active:scale-[0.98]"
                >
                  <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  Ver detalles
                </Link>
                <Link
                  href={`/clients/${drawerClient.id}/edit`}
                  onClick={closeDrawer}
                  className="inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 px-4 py-3 text-sm font-bold text-white shadow-lg border-2 border-gray-500/50 transition-all hover:shadow-xl hover:scale-[1.02] hover:from-gray-700 hover:to-gray-800 active:scale-[0.98]"
                >
                  <Lock className="h-4 w-4 flex-shrink-0" />
                  Editar cliente
                </Link>
              </div>
            </div>
          )}
        </Drawer>

        {/* Shared Modals */}
        <ClientModals
          creditModal={creditModal}
          setCreditModal={setCreditModal}
          blockModal={blockModal}
          setBlockModal={setBlockModal}
          selectedClient={selectedClient}
          setSelectedClient={setSelectedClient}
        />
      </div>
    </div>
  );
}
