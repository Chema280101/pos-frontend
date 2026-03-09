import { TrendingUp, TrendingDown, DollarSign, FileText, Users, Calendar, Download, BarChart3, Target, Award, Clock, CheckCircle, Building2, Package, Receipt } from 'lucide-react';
import { format, startOfDay, endOfDay, subDays, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ReportsMetricsProps {
  reportType: string;
  dateFrom: Date;
  dateTo: Date;
  unit: string;
}

interface ReportsMetricsData {
  totalReports: number;
  reportsThisWeek: number;
  reportsToday: number;
  exportCount: number;
  avgProcessingTime: number;
  successRate: number;
  mostPopularReport: string;
  totalDataPoints: number;
  lastWeekGrowth: number;
  avgFileSize: number;
  activeUsers: number;
  scheduledReports: number;
  errorCount: number;
  peakHour: string;
}

export function ReportsMetrics({ reportType, dateFrom, dateTo, unit }: ReportsMetricsProps) {
  // ✅ NUEVO: Obtener métricas reales desde la API
  const { data: metricsData, isLoading } = useQuery({
    queryKey: ['reports-metrics', unit, dateFrom, dateTo],
    queryFn: async (): Promise<ReportsMetricsData> => {
      const params = new URLSearchParams({
        unit: unit || '',
        from: dateFrom.toISOString(),
        to: dateTo.toISOString(),
      });
      const { data } = await api.get<ReportsMetricsData>(`/api/reports/metrics?${params}`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });

  // Calculate period metrics
  const daysDiff = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
  const periodLabel = daysDiff === 1 ? 'Hoy' : daysDiff <= 7 ? 'Esta semana' : daysDiff <= 30 ? 'Este mes' : `${daysDiff} días`;

  // Report type specific metrics
  const getReportIcon = (type: string) => {
    switch (type) {
      case 'sales': return <DollarSign className="h-5 w-5" />;
      case 'appointments': return <Calendar className="h-5 w-5" />;
      case 'clients': return <Users className="h-5 w-5" />;
      case 'inventory': return <Package className="h-5 w-5" />;
      case 'commissions': return <Receipt className="h-5 w-5" />;
      case 'cash-register': return <Building2 className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getReportName = (type: string) => {
    switch (type) {
      case 'sales': return 'Ventas';
      case 'appointments': return 'Citas';
      case 'clients': return 'Clientes';
      case 'inventory': return 'Inventario';
      case 'commissions': return 'Comisiones';
      case 'cash-register': return 'Caja';
      default: return 'General';
    }
  };

  // Mostrar loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  // Usar datos reales o valores por defecto si no hay datos
  const data = metricsData || {
    totalReports: 0,
    reportsThisWeek: 0,
    reportsToday: 0,
    exportCount: 0,
    avgProcessingTime: 0,
    successRate: 0,
    mostPopularReport: 'N/A',
    totalDataPoints: 0,
    lastWeekGrowth: 0,
    avgFileSize: 0,
    activeUsers: 0,
    scheduledReports: 0,
    errorCount: 0,
    peakHour: 'N/A'
  };

  return (
    <>
      {/* First Row - 4 Core Reports Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Reports Generated */}
        <div className="relative overflow-hidden rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-50 to-blue-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-blue-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-blue-600 shadow-lg group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-blue-800 bg-white px-3 py-1 rounded-full border border-blue-300 shadow-sm">Total</span>
            </div>
            <p className="text-3xl font-bold text-blue-900 tabular-nums mb-2">{data.totalReports}</p>
            <p className="text-sm text-blue-700 font-medium">Reportes generados</p>
          </div>
        </div>

        {/* Reports This Period */}
        <div className="relative overflow-hidden rounded-xl border-2 border-green-500/30 bg-gradient-to-br from-green-50 to-green-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-green-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 border-2 border-green-600 shadow-lg group-hover:scale-110 transition-transform">
                {getReportIcon(reportType)}
              </div>
              <span className="text-xs font-bold text-green-800 bg-white px-3 py-1 rounded-full border border-green-300 shadow-sm">Período</span>
            </div>
            <p className="text-3xl font-bold text-green-900 tabular-nums mb-2">{data.reportsThisWeek}</p>
            <p className="text-sm text-green-700 font-medium">{periodLabel}</p>
          </div>
        </div>

        {/* Export Count */}
        <div className="relative overflow-hidden rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-50 to-purple-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-purple-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-purple-600 shadow-lg group-hover:scale-110 transition-transform">
                <Download className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-purple-800 bg-white px-3 py-1 rounded-full border border-purple-300 shadow-sm">Exportados</span>
            </div>
            <p className="text-3xl font-bold text-purple-900 tabular-nums mb-2">{data.exportCount}</p>
            <p className="text-sm text-purple-700 font-medium">Descargas totales</p>
          </div>
        </div>

        {/* Success Rate */}
        <div className="relative overflow-hidden rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/50 to-emerald-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 border-2 border-emerald-600 shadow-lg group-hover:scale-110 transition-transform">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-300 shadow-sm">Éxito</span>
            </div>
            <p className="text-3xl font-bold text-emerald-900 tabular-nums mb-2">{data.successRate}%</p>
            <p className="text-sm text-emerald-700 font-medium">Tasa de éxito</p>
          </div>
        </div>
      </div>

      {/* Second Row - 4 Additional Reports Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Processing Time */}
        <div className="relative overflow-hidden rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-50 to-amber-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-100/50 to-amber-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 border-2 border-amber-600 shadow-lg group-hover:scale-110 transition-transform">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-amber-800 bg-white px-3 py-1 rounded-full border border-amber-300 shadow-sm">Velocidad</span>
            </div>
            <p className="text-3xl font-bold text-amber-900 tabular-nums mb-2">{data.avgProcessingTime}s</p>
            <p className="text-sm text-amber-700 font-medium">Tiempo promedio</p>
          </div>
        </div>

        {/* Most Popular Report */}
        <div className="relative overflow-hidden rounded-xl border-2 border-pink-500/30 bg-gradient-to-br from-pink-50 to-pink-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-100/50 to-pink-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 border-2 border-pink-600 shadow-lg group-hover:scale-110 transition-transform">
                <Award className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-pink-800 bg-white px-3 py-1 rounded-full border border-pink-300 shadow-sm">Popular</span>
            </div>
            <p className="text-lg font-bold text-pink-900 tabular-nums mb-1 truncate">
              {data.mostPopularReport}
            </p>
            <p className="text-sm text-pink-700 font-medium">
              Más solicitado
            </p>
          </div>
        </div>

        {/* Active Users */}
        <div className="relative overflow-hidden rounded-xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/50 to-indigo-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 border-2 border-indigo-600 shadow-lg group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-indigo-800 bg-white px-3 py-1 rounded-full border border-indigo-300 shadow-sm">Usuarios</span>
            </div>
            <p className="text-3xl font-bold text-indigo-900 tabular-nums mb-2">{data.activeUsers}</p>
            <p className="text-sm text-indigo-700 font-medium">Activos hoy</p>
          </div>
        </div>

        {/* Growth Rate */}
        <div className="relative overflow-hidden rounded-xl border-2 border-teal-500/30 bg-gradient-to-br from-teal-50 to-teal-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-100/50 to-teal-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 border-2 border-teal-600 shadow-lg group-hover:scale-110 transition-transform">
                {data.lastWeekGrowth > 0 ? (
                  <TrendingUp className="h-6 w-6 text-white" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-white" />
                )}
              </div>
              <span className="text-xs font-bold text-teal-800 bg-white px-3 py-1 rounded-full border border-teal-300 shadow-sm">Crecimiento</span>
            </div>
            <p className="text-3xl font-bold text-teal-900 tabular-nums mb-2">+{data.lastWeekGrowth}%</p>
            <p className="text-sm text-teal-700 font-medium">vs semana anterior</p>
          </div>
        </div>
      </div>
    </>
  );
}
