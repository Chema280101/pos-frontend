'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, differenceInDays, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle, Clock, Search, Filter, X, ChevronDown, ChevronUp, RefreshCw, Package } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  unit: string;
  stock: number;
  expiryDate: string | null;
}

const EXPIRY_WARNING_DAYS = 30;
const EXPIRY_CRITICAL_DAYS = 7;

export function ExpiryAlerts(): JSX.Element {
  const [search, setSearch] = useState<string>('');
  const [showFilters, setShowFilters] = useState(true);
  const [alertType, setAlertType] = useState<string>('all');

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ['inventory', 'expiry-alerts'],
    queryFn: async (): Promise<Product[]> => {
      const { data } = await api.get<{ data: Product[] }>('/api/inventory/products?limit=500');
      return data.data;
    },
  });

  const alerts = useMemo(() => {
    if (!products) return [];
    const now = new Date();
    return products
      .filter((p) => p.expiryDate && p.stock > 0)
      .map((p) => {
        const expiry = new Date(p.expiryDate!);
        const daysLeft = differenceInDays(expiry, now);
        const expired = isPast(expiry);
        return { ...p, expiry, daysLeft, expired };
      })
      .filter((p) => p.daysLeft <= EXPIRY_WARNING_DAYS || p.expired)
      .filter((p) => {
        if (search) return p.name.toLowerCase().includes(search.toLowerCase());
        if (alertType === 'expired') return p.expired;
        if (alertType === 'critical') return p.daysLeft <= EXPIRY_CRITICAL_DAYS && !p.expired;
        if (alertType === 'warning') return p.daysLeft > EXPIRY_CRITICAL_DAYS && p.daysLeft <= EXPIRY_WARNING_DAYS && !p.expired;
        return true;
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [products, search, alertType]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--unit-surface)] via-[var(--unit-surface-elevated)] to-[var(--unit-surface)]">
        <div className="absolute inset-0 opacity-30">
          <div className="h-full w-full bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto p-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-4">
              <div className="h-2 w-2 rounded-full bg-[var(--unit-accent)] animate-pulse"></div>
              <span className="text-sm font-medium text-[var(--unit-text)]">
                Sistema de Alertas
              </span>
            </div>
            <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">Alertas de Vencimiento</h1>
            <p className="text-[var(--unit-text-muted)]">
              Control de productos próximos a vencer
            </p>
          </div>
          
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--unit-surface)] via-[var(--unit-surface-elevated)] to-[var(--unit-surface)]">
      {/* Background Pattern - Exacto estilo InventoryPage */}
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto p-6">
        {/* Enhanced Header - Exacto estilo InventoryPage */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-4">
              <div className="h-2 w-2 rounded-full bg-[var(--unit-accent)] animate-pulse"></div>
              <span className="text-sm font-medium text-[var(--unit-text)]">
                Sistema de Alertas
              </span>
            </div>
            <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">Alertas de Vencimiento</h1>
            <p className="text-[var(--unit-text-muted)]">
              Control de productos próximos a vencer
            </p>
          </div>

          {/* Enhanced Action Buttons - Exacto estilo InventoryPage */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-lg border-2 border-blue-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw className="h-5 w-5" />
              Actualizar Alertas
            </button>
            <button
              onClick={() => window.location.href = '/inventory/products'}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white font-bold shadow-lg border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <Package className="h-5 w-5" />
              Ver Productos
            </button>
          </div>
        </div>

        {/* Enhanced Alerts Filters - Exacto estilo InventoryPage */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6 mb-8">
          {/* Filter Header */}
          <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Filtros de Alertas</h3>
                  <p className="text-sm text-[var(--unit-text-muted)]">Refina tus alertas</p>
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

          {/* Filter Content */}
          {showFilters && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Alert Type Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Tipo de Alerta</label>
                  <select
                    value={alertType}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                    onChange={(e) => setAlertType(e.target.value)}
                  >
                    <option value="all">Todas las alertas</option>
                    <option value="expired">Vencidos</option>
                    <option value="critical">Críticos (≤7 días)</option>
                    <option value="warning">Advertencia (≤30 días)</option>
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
                      placeholder="Buscar por nombre de producto..."
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

              {/* Active Filters Summary */}
              {(alertType !== 'all' || search) && (
                <div className="rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Filtros activos:</span>
                      <div className="flex flex-wrap gap-2">
                        {alertType !== 'all' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 border border-red-200">
                            Tipo: {alertType === 'expired' ? 'Vencidos' : 
                                   alertType === 'critical' ? 'Críticos' : 
                                   alertType === 'warning' ? 'Advertencia' : alertType}
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
                        setAlertType('all');
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

        {/* Alerts Table - Exacto estilo InventoryPage */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6">
          {/* Table Header */}
          <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Alertas Activas</h3>
                  <p className="text-sm text-[var(--unit-text-muted)]">Productos que requieren atención</p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-red-500/20 px-3 py-1.5 text-sm font-bold text-red-700 border border-red-300/30 shadow-sm">
                {alerts.length} alertas
              </span>
            </div>
          </div>

          {/* Alerts List */}
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="mb-3 h-16 w-16 text-green-500/50" />
              <h4 className="text-xl font-bold text-[var(--unit-text)] mb-2">¡Excelente!</h4>
              <p className="text-[var(--unit-text-muted)] mb-4">
                No hay alertas de vencimiento activas
              </p>
              <p className="text-sm text-[var(--unit-text-muted)]/60">
                Ningún producto está próximo a vencer en los próximos {EXPIRY_WARNING_DAYS} días.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((p) => {
                const isCritical = p.expired || p.daysLeft <= EXPIRY_CRITICAL_DAYS;
                return (
                  <div
                    key={p.id}
                    className={cn(
                      'relative overflow-hidden rounded-xl border-2 p-6 hover:shadow-lg transition-all duration-300 group',
                      isCritical
                        ? 'border-red-500/50 bg-gradient-to-br from-red-50/95 to-red-100/85'
                        : 'border-amber-500/50 bg-gradient-to-br from-amber-50/95 to-amber-100/85'
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                      style={{
                        backgroundImage: isCritical 
                          ? `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23EF4444' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                          : `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23F59E0B' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                      }}
                    ></div>
                    
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-xl shadow-lg',
                          isCritical ? 'bg-red-500' : 'bg-amber-500'
                        )}>
                          <AlertTriangle className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-[var(--unit-text)]">{p.name}</h4>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-[var(--unit-text-muted)]">
                              <span className="font-medium">Unidad:</span> {p.unit}
                            </span>
                            <span className="text-sm text-[var(--unit-text-muted)]">
                              <span className="font-medium">Stock:</span> {p.stock}
                            </span>
                            <span className="text-sm text-[var(--unit-text-muted)]">
                              <span className="font-medium">Vence:</span> {format(p.expiry, 'd MMM yyyy', { locale: es })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={p.expired ? 'danger' : isCritical ? 'danger' : 'warning'}
                          className="px-4 py-2 text-sm font-bold"
                        >
                          {p.expired ? 'VENCIDO' : isCritical ? `CRÍTICO: ${p.daysLeft}d` : `ADVERTENCIA: ${p.daysLeft}d`}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}