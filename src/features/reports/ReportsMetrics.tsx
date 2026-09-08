import { TrendingUp, TrendingDown, FileText, Users, Calendar, Download, BarChart3, Award, Clock, CheckCircle, Building2, Package, Receipt } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { KPICard } from '@/components/ui/KPICard';

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
  const { data: metricsData, isLoading } = useQuery({
    queryKey: ['reports-metrics', unit, dateFrom, dateTo],
    queryFn: async (): Promise<ReportsMetricsData> => {
      const storageKey = 'reports-metrics';
      const stored = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
      
      let metrics: ReportsMetricsData;
      
      if (stored) {
        metrics = JSON.parse(stored);
      } else {
        metrics = {
          totalReports: 0,
          reportsThisWeek: 0,
          reportsToday: 0,
          exportCount: 0,
          avgProcessingTime: 0,
          successRate: 100,
          mostPopularReport: 'N/A',
          totalDataPoints: 0,
          lastWeekGrowth: 0,
          avgFileSize: 0,
          activeUsers: 1,
          scheduledReports: 0,
          errorCount: 0,
          peakHour: 'N/A'
        };
      }
      
      return metrics;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const daysDiff = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
  const periodLabel = daysDiff === 1 ? 'Hoy' : daysDiff <= 7 ? 'Esta semana' : daysDiff <= 30 ? 'Este mes' : `${daysDiff} días`;

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'sales': return <BarChart3 className="h-6 w-6 text-white" />;
      case 'appointments': return <Calendar className="h-6 w-6 text-white" />;
      case 'clients': return <Users className="h-6 w-6 text-white" />;
      case 'inventory': return <Package className="h-6 w-6 text-white" />;
      case 'commissions': return <Receipt className="h-6 w-6 text-white" />;
      case 'cash-register': return <Building2 className="h-6 w-6 text-white" />;
      default: return <FileText className="h-6 w-6 text-white" />;
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-[var(--unit-surface-elevated)] border border-[var(--unit-border)] rounded-unit"></div>
          </div>
        ))}
      </div>
    );
  }

  const data = metricsData || {
    totalReports: 0,
    reportsThisWeek: 0,
    reportsToday: 0,
    exportCount: 0,
    avgProcessingTime: 0,
    successRate: 100,
    mostPopularReport: 'N/A',
    totalDataPoints: 0,
    lastWeekGrowth: 0,
    avgFileSize: 0,
    activeUsers: 1,
    scheduledReports: 0,
    errorCount: 0,
    peakHour: 'N/A'
  };

  return (
    <div className="space-y-4 mb-6">
      {/* First Row - 4 Core Reports Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Reportes Generados"
          value={data.totalReports}
          description="Consultas ejecutadas"
          color="blue"
          icon={<FileText className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="En el Período"
          value={data.reportsThisWeek}
          description={periodLabel}
          color="green"
          icon={getReportIcon(reportType)}
        />
        <KPICard
          title="Descargas / Export"
          value={data.exportCount}
          description="Archivos Excel/PDF"
          color="purple"
          icon={<Download className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Tasa de Éxito"
          value={`${data.successRate}%`}
          description="Ejecuciones sin error"
          color="teal"
          icon={<CheckCircle className="h-6 w-6 text-white" />}
        />
      </div>

      {/* Second Row - 4 Additional Reports Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Velocidad Promedio"
          value={`${data.avgProcessingTime}s`}
          description="Tiempo de procesamiento"
          color="amber"
          icon={<Clock className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Más Popular"
          value={data.mostPopularReport}
          description="Módulo más consultado"
          color="pink"
          icon={<Award className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Usuarios Activos"
          value={data.activeUsers}
          description="Consultando hoy"
          color="indigo"
          icon={<Users className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Crecimiento"
          value={`+${data.lastWeekGrowth}%`}
          description="vs semana anterior"
          color="green"
          icon={<TrendingUp className="h-6 w-6 text-white" />}
        />
      </div>
    </div>
  );
}
