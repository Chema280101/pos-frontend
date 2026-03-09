import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ReportKPICard } from './shared/ReportKPICard';
import { DollarSign, Calendar, Users, FileText, TrendingUp, Package, CreditCard, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OverviewStats {
  totalSales: number;
  totalRevenue: number;
  totalAppointments: number;
  totalClients: number;
  avgTicket: number;
  topService: string;
  topEmployee: string;
  lowStockProducts: number;
}

interface ReportOverviewProps {
  unit: string;
  dateFrom: Date;
  dateTo: Date;
}

export function ReportOverview({ unit, dateFrom, dateTo }: ReportOverviewProps): JSX.Element {
  const { data: overviewStats, isLoading } = useQuery({
    queryKey: ['reports-overview', unit, dateFrom, dateTo],
    queryFn: async (): Promise<OverviewStats> => {
      const params = new URLSearchParams({
        unit: unit || '',
        from: dateFrom.toISOString(),
        to: dateTo.toISOString(),
      });
      const { data } = await api.get<OverviewStats>(`/api/reports/overview?${params}`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (gcTime reemplaza a cacheTime)
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!overviewStats) {
    return (
      <div className="text-center py-8 text-[var(--unit-text-muted)]">
        No hay datos disponibles para el período seleccionado.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportKPICard
          title="Ventas Totales"
          value={overviewStats.totalSales}
          subtitle={`S/ ${overviewStats.totalRevenue.toFixed(2)}`}
          icon={DollarSign}
        />
        <ReportKPICard
          title="Citas"
          value={overviewStats.totalAppointments}
          subtitle="Período seleccionado"
          icon={Calendar}
        />
        <ReportKPICard
          title="Clientes"
          value={overviewStats.totalClients}
          subtitle="Activos"
          icon={Users}
        />
        <ReportKPICard
          title="Ticket Promedio"
          value={`S/ ${overviewStats.avgTicket.toFixed(2)}`}
          subtitle="Por venta"
          icon={FileText}
        />
      </div>

      {/* Quick Access to Detailed Reports - Premium Glassmorphism */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Sales Preview - Premium */}
          <div className="relative overflow-hidden rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 hover:shadow-lg transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/50 to-emerald-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-300">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-emerald-900">Ventas</h3>
                </div>
                <Link
                  href="/reports/sales"
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-emerald-700 bg-white rounded-full border border-emerald-300 hover:bg-emerald-50 transition-colors"
                >
                  Ver todo
                  <TrendingUp className="h-3 w-3" />
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-emerald-900 tabular-nums">{overviewStats.totalSales}</p>
                  <p className="text-sm text-emerald-700 font-medium">Ventas totales</p>
                </div>
              </div>
            </div>
          </div>

          {/* Appointments Preview - Premium */}
          <div className="relative overflow-hidden rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-50 to-blue-100 p-6 hover:shadow-lg transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-blue-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 border border-blue-300">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-blue-900">Citas</h3>
                </div>
                <Link
                  href="/reports/appointments"
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-blue-700 bg-white rounded-full border border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  Ver todo
                  <Calendar className="h-3 w-3" />
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-900 tabular-nums">{overviewStats.totalAppointments}</p>
                  <p className="text-sm text-blue-700 font-medium">Citas programadas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Clients Preview - Premium */}
          <div className="relative overflow-hidden rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-50 to-purple-100 p-6 hover:shadow-lg transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-purple-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 border border-purple-300">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-purple-900">Clientes</h3>
                </div>
                <Link
                  href="/reports/clients"
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-purple-700 bg-white rounded-full border border-purple-300 hover:bg-purple-50 transition-colors"
                >
                  Ver todo
                  <Users className="h-3 w-3" />
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-purple-900 tabular-nums">{overviewStats.totalClients}</p>
                  <p className="text-sm text-purple-700 font-medium">Clientes activos</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Top Service - Premium */}
          <div className="relative overflow-hidden rounded-xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 hover:shadow-lg transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/50 to-indigo-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 border border-indigo-300">
                    <Package className="h-4 w-4 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-bold text-indigo-900">Servicio Top</h3>
                </div>
                <Link
                  href="/reports/services"
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-indigo-700 bg-white rounded-full border border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  Ver servicios
                  <Package className="h-3 w-3" />
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-indigo-900 truncate max-w-[200px]">{overviewStats.topService}</p>
                  <p className="text-sm text-indigo-700 font-medium">Más solicitado</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Employee - Premium */}
          <div className="relative overflow-hidden rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-50 to-amber-100 p-6 hover:shadow-lg transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-100/50 to-amber-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-300">
                    <Calculator className="h-4 w-4 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-bold text-amber-900">Empleado Top</h3>
                </div>
                <Link
                  href="/reports/commissions"
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-amber-700 bg-white rounded-full border border-amber-300 hover:bg-amber-50 transition-colors"
                >
                  Ver comisiones
                  <Calculator className="h-3 w-3" />
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
                  <Calculator className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-900 truncate max-w-[200px]">{overviewStats.topEmployee}</p>
                  <p className="text-sm text-amber-700 font-medium">Mejor rendimiento</p>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Alert - Premium */}
          <div className={cn(
            'relative overflow-hidden rounded-xl border-2 p-6 hover:shadow-lg transition-all duration-300 group',
            overviewStats.lowStockProducts > 0 
              ? 'border-red-500/30 bg-gradient-to-br from-red-50 to-red-100' 
              : 'border-green-500/30 bg-gradient-to-br from-green-50 to-green-100'
          )}>
            <div className={cn(
              'absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity rounded-xl',
              overviewStats.lowStockProducts > 0 
                ? 'from-red-100/50 to-red-200/50' 
                : 'from-green-100/50 to-green-200/50'
            )}></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg border',
                    overviewStats.lowStockProducts > 0 
                      ? 'bg-red-500/20 border-red-300' 
                      : 'bg-green-500/20 border-green-300'
                  )}>
                    <Package className={cn(
                      'h-4 w-4',
                      overviewStats.lowStockProducts > 0 ? 'text-red-600' : 'text-green-600'
                    )} />
                  </div>
                  <h3 className={cn(
                    'text-lg font-bold',
                    overviewStats.lowStockProducts > 0 ? 'text-red-900' : 'text-green-900'
                  )}>Inventario</h3>
                </div>
                <Link
                  href="/reports/inventory"
                  className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5 text-sm font-bold rounded-full border hover:transition-colors',
                    overviewStats.lowStockProducts > 0 
                      ? 'text-red-700 bg-white border-red-300 hover:bg-red-50' 
                      : 'text-green-700 bg-white border-green-300 hover:bg-green-50'
                  )}
                >
                  Ver inventario
                  <Package className="h-3 w-3" />
                </Link>
              </div>
              <div className={cn(
                'flex items-center gap-4',
                overviewStats.lowStockProducts > 0 && 'text-red-600'
              )}>
                <div className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl shadow-lg',
                  overviewStats.lowStockProducts > 0 
                    ? 'bg-gradient-to-br from-red-500 to-red-600' 
                    : 'bg-gradient-to-br from-green-500 to-green-600'
                )}>
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className={cn(
                    'text-3xl font-bold tabular-nums',
                    overviewStats.lowStockProducts > 0 ? 'text-red-900' : 'text-green-900'
                  )}>{overviewStats.lowStockProducts}</p>
                  <p className={cn(
                    'text-sm font-medium',
                    overviewStats.lowStockProducts > 0 ? 'text-red-700' : 'text-green-700'
                  )}>
                    {overviewStats.lowStockProducts > 0 ? 'Productos con stock bajo' : 'Inventario OK'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Period Info */}
      <div className="text-center text-sm text-[var(--unit-text)]">
        Período: {format(dateFrom, 'd MMM yyyy', { locale: es })} - {format(dateTo, 'd MMM yyyy', { locale: es })}
        {unit && ` • Unidad: ${unit === 'SPA' ? 'SPA' : 'Barbería'}`}
      </div>
    </div>
  );
}
