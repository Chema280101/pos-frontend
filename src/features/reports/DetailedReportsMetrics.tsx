import { DollarSign, FileText, Calendar, BarChart3, Target, Filter } from 'lucide-react';
import { isToday, isThisWeek } from 'date-fns';
import { KPICard } from '@/components/ui/KPICard';

interface UnifiedReportData {
  id: string;
  type: 'sale' | 'appointment' | 'client' | 'product' | 'commission' | 'cash-register';
  referenceId: string;
  title: string;
  subtitle?: string;
  amount?: number;
  status?: string;
  date: string;
  unit: 'SPA' | 'BARBERIA';
  customer?: string;
  employee?: string;
  details?: Record<string, any>;
}

interface DetailedReportsMetricsProps {
  data: UnifiedReportData[];
  filteredData: UnifiedReportData[];
  selectedType: string;
  selectedStatus: string;
  searchTerm: string;
  unit: string;
  dateFrom: Date;
  dateTo: Date;
}

export function DetailedReportsMetrics({ 
  data, 
  filteredData, 
  dateFrom, 
  dateTo 
}: DetailedReportsMetricsProps) {
  const totalRecords = data.length;
  const filteredRecords = filteredData.length;
  
  const todayRecords = data.filter(item => {
    const itemDate = new Date(item.date);
    return isToday(itemDate);
  });

  const typeBreakdown = data.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const spaRecords = data.filter(item => item.unit === 'SPA').length;
  const barberiaRecords = data.filter(item => item.unit === 'BARBERIA').length;

  const totalAmount = data.reduce((sum, item) => sum + (item.amount || 0), 0);

  const mostActiveType = Object.entries(typeBreakdown).reduce((best, [type, count]) => 
    count > best.count ? { type, count } : best
  , { type: '', count: 0 });

  const filterEffectiveness = totalRecords > 0 ? ((totalRecords - filteredRecords) / totalRecords) * 100 : 0;
  const daysDiff = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
  const recordsPerDay = daysDiff > 0 ? totalRecords / daysDiff : 0;

  const getTypeName = (type: string) => {
    switch (type) {
      case 'sale': return 'Ventas';
      case 'appointment': return 'Citas';
      case 'client': return 'Clientes';
      case 'product': return 'Productos';
      case 'commission': return 'Comisiones';
      case 'cash-register': return 'Caja';
      default: return 'General';
    }
  };

  return (
    <div className="space-y-4 mb-6">
      {/* First Row - 4 Core Detailed Reports Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Registros"
          value={totalRecords.toLocaleString()}
          description="Movimientos consultados"
          color="blue"
          icon={<FileText className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Registros Visibles"
          value={filteredRecords.toLocaleString()}
          description="Tras aplicar filtros"
          color="purple"
          icon={<Filter className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Registros de Hoy"
          value={todayRecords.length}
          description="Actividad de la fecha"
          color="green"
          icon={<Calendar className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Módulo Principal"
          value={getTypeName(mostActiveType.type)}
          subtitle={`${mostActiveType.count} registros`}
          description="Mayor volumen de filas"
          color="pink"
          icon={<BarChart3 className="h-6 w-6 text-white" />}
        />
      </div>

      {/* Second Row - 4 Additional Detailed Reports Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Distribución Unidades"
          value={`SPA: ${spaRecords}`}
          subtitle={`Barbería: ${barberiaRecords}`}
          description="Porcentaje por sede"
          color="amber"
          icon={<BarChart3 className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Frecuencia Diaria"
          value={recordsPerDay.toFixed(1)}
          description="Operaciones por día"
          color="indigo"
          icon={<BarChart3 className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Suma Financiera"
          value={totalAmount.toFixed(2)}
          unit="S/"
          description="Monto acumulado en filtro"
          color="teal"
          icon={<DollarSign className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Precisión Filtros"
          value={`${(100 - filterEffectiveness).toFixed(1)}%`}
          description="Segmentación activa"
          color="green"
          icon={<Target className="h-6 w-6 text-white" />}
        />
      </div>
    </div>
  );
}
