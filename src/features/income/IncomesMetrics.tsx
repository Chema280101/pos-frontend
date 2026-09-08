import { TrendingUp, Calendar, DollarSign, BarChart3, Wallet, Activity, Award } from 'lucide-react';
import { KPICard } from '@/components/ui/KPICard';

interface Income {
  id: string;
  saleNumber: string;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
  } | null;
  appointment?: {
    id: string;
    startTime: string;
  } | null;
}

interface IncomesMetricsProps {
  incomes: Income[];
  totalAmount?: number;
  aggregatedMetrics?: {
    todayTotal: number;
    weekTotal: number;
    monthTotal: number;
    trend: number;
    cashPayments: number;
    cardPayments: number;
    transferPayments: number;
    digitalPayments: number;
    bestDay: {
      date: string;
      total: number;
    };
    todayCommissions?: number;
    weekCommissions?: number;
    monthCommissions?: number;
    totalCommissions?: number;
  };
}

export function IncomesMetrics({ incomes, totalAmount, aggregatedMetrics }: IncomesMetricsProps) {
  const total = totalAmount ?? incomes.reduce((sum, i) => sum + i.total, 0);
  
  const todayTotal = aggregatedMetrics?.todayTotal ?? (() => {
    const today = new Date();
    const todayIncomes = incomes.filter(i => {
      const incomeDate = new Date(i.createdAt);
      return incomeDate.toDateString() === today.toDateString();
    });
    return todayIncomes.reduce((sum, i) => sum + i.total, 0);
  })();
  
  const weekTotal = aggregatedMetrics?.weekTotal ?? (() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekIncomes = incomes.filter(i => new Date(i.createdAt) >= weekAgo);
    return weekIncomes.reduce((sum, i) => sum + i.total, 0);
  })();
  
  const monthTotal = aggregatedMetrics?.monthTotal ?? (() => {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthIncomes = incomes.filter(i => new Date(i.createdAt) >= monthAgo);
    return monthIncomes.reduce((sum, i) => sum + i.total, 0);
  })();
  
  const averageSale = total > 0 ? total / incomes.length : 0;
  const cashPayments = aggregatedMetrics?.cashPayments ?? incomes.filter(i => i.paymentMethod === 'Efectivo').length;
  
  const trend = aggregatedMetrics?.trend ?? (() => {
    const previousMonthAgo = new Date();
    previousMonthAgo.setDate(previousMonthAgo.getDate() - 60);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const previousMonthIncomes = incomes.filter(i => {
      const date = new Date(i.createdAt);
      return date >= previousMonthAgo && date < monthAgo;
    });
    const previousMonthTotal = previousMonthIncomes.reduce((sum, i) => sum + i.total, 0);
    return previousMonthTotal > 0 ? ((monthTotal - previousMonthTotal) / previousMonthTotal) * 100 : 0;
  })();
  
  const bestDay = aggregatedMetrics?.bestDay ?? (() => {
    const dailyTotals = incomes.reduce((acc, income) => {
      const date = new Date(income.createdAt).toDateString();
      acc[date] = (acc[date] || 0) + income.total;
      return acc;
    }, {} as Record<string, number>);
    const bestDayEntries = Object.entries(dailyTotals);
    return bestDayEntries.reduce((max, [date, total]) => 
      total > max[1] ? [date, total] : max, ['', 0]) as [string, number];
  })();

  const bestDayDate = Array.isArray(bestDay) && bestDay[0] 
    ? new Date(bestDay[0]).toLocaleDateString('es', { day: 'numeric', month: 'short' })
    : !Array.isArray(bestDay) && bestDay.date 
    ? new Date(bestDay.date).toLocaleDateString('es', { day: 'numeric', month: 'short' })
    : 'N/A';

  const bestDayAmount = Array.isArray(bestDay) ? bestDay[1] : bestDay.total;

  return (
    <div className="space-y-4 mb-6">
      {/* First Row - 4 Primary Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Ingresos Totales"
          value={total.toFixed(2)}
          unit="S/"
          description="Facturación global"
          color="green"
          icon={<DollarSign className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Ingresos de Hoy"
          value={todayTotal.toFixed(2)}
          unit="S/"
          description="Ventas de la fecha"
          color="blue"
          icon={<Calendar className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Últimos 7 Días"
          value={weekTotal.toFixed(2)}
          unit="S/"
          description="Total semanal"
          color="purple"
          icon={<BarChart3 className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Últimos 30 Días"
          value={monthTotal.toFixed(2)}
          unit="S/"
          description="Total mensual"
          color="amber"
          icon={<TrendingUp className="h-6 w-6 text-white" />}
        />
      </div>

      {/* Second Row - 4 Additional Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Ticket Promedio"
          value={averageSale.toFixed(2)}
          unit="S/"
          description="Venta media por transacción"
          color="indigo"
          icon={<Activity className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Crecimiento"
          value={`${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`}
          description="vs mes anterior"
          color="teal"
          icon={<TrendingUp className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Pagos Efectivo"
          value={cashPayments}
          description="Transacciones en cash"
          color="pink"
          icon={<Wallet className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Mejor Día"
          value={bestDayDate}
          subtitle={`S/ ${Number(bestDayAmount || 0).toFixed(2)}`}
          description="Pico histórico de venta"
          color="green"
          icon={<Award className="h-6 w-6 text-white" />}
        />
      </div>
    </div>
  );
}
