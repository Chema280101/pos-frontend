import { TrendingUp, Calendar, DollarSign, BarChart3, CreditCard, Wallet, Smartphone, ArrowUp, ArrowDown, Activity, Users } from 'lucide-react';

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
  totalAmount?: number; // New prop for total amount from backend
}

export function IncomesMetrics({ incomes, totalAmount }: IncomesMetricsProps) {
  // Use totalAmount from backend if available, otherwise calculate from paginated data
  const total = totalAmount ?? incomes.reduce((sum, i) => sum + i.total, 0);
  const today = new Date();
  const todayIncomes = incomes.filter(i => {
    const incomeDate = new Date(i.createdAt);
    return incomeDate.toDateString() === today.toDateString();
  });
  const todayTotal = todayIncomes.reduce((sum, i) => sum + i.total, 0);
  
  // This week (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekIncomes = incomes.filter(i => new Date(i.createdAt) >= weekAgo);
  const weekTotal = weekIncomes.reduce((sum, i) => sum + i.total, 0);
  
  // This month (last 30 days)
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthIncomes = incomes.filter(i => new Date(i.createdAt) >= monthAgo);
  const monthTotal = monthIncomes.reduce((sum, i) => sum + i.total, 0);
  
  // Additional metrics
  const averageSale = incomes.length > 0 ? total / incomes.length : 0;
  const cashPayments = incomes.filter(i => i.paymentMethod === 'CASH').length;
  const cardPayments = incomes.filter(i => i.paymentMethod === 'CARD').length;
  const transferPayments = incomes.filter(i => i.paymentMethod === 'TRANSFER').length;
  const yapePayments = incomes.filter(i => i.paymentMethod === 'YAPE').length;
  
  // Trend calculation (compare with previous period)
  const previousMonthAgo = new Date();
  previousMonthAgo.setDate(previousMonthAgo.getDate() - 60);
  const previousMonthIncomes = incomes.filter(i => {
    const date = new Date(i.createdAt);
    return date >= previousMonthAgo && date < monthAgo;
  });
  const previousMonthTotal = previousMonthIncomes.reduce((sum, i) => sum + i.total, 0);
  const trend = previousMonthTotal > 0 ? ((monthTotal - previousMonthTotal) / previousMonthTotal) * 100 : 0;
  
  // Best day
  const dailyTotals = incomes.reduce((acc, income) => {
    const date = new Date(income.createdAt).toDateString();
    acc[date] = (acc[date] || 0) + income.total;
    return acc;
  }, {} as Record<string, number>);
  const bestDay = Object.entries(dailyTotals).reduce((max, [date, total]) => 
    total > max[1] ? [date, total] : max, ['', 0]);

  return (
    <>
      {/* First Row - 4 Primary Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Income */}
        <div className="relative overflow-hidden rounded-xl border-2 border-green-500/30 bg-gradient-to-br from-green-50 to-green-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-green-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 border-2 border-green-600 shadow-lg group-hover:scale-110 transition-transform">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-green-800 bg-white px-3 py-1 rounded-full border border-green-300 shadow-sm">Total</span>
            </div>
            <p className="text-3xl font-bold text-green-900 tabular-nums mb-2">S/{total.toFixed(2)}</p>
            <p className="text-sm text-green-700 font-medium">Ingresos totales</p>
          </div>
        </div>

        {/* Today's Income */}
        <div className="relative overflow-hidden rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-50 to-blue-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-blue-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-blue-600 shadow-lg group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-blue-800 bg-white px-3 py-1 rounded-full border border-blue-300 shadow-sm">Hoy</span>
            </div>
            <p className="text-3xl font-bold text-blue-900 tabular-nums mb-2">S/{todayTotal.toFixed(2)}</p>
            <p className="text-sm text-blue-700 font-medium">Ingresos de hoy</p>
          </div>
        </div>

        {/* Week Income */}
        <div className="relative overflow-hidden rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-50 to-purple-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-purple-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-purple-600 shadow-lg group-hover:scale-110 transition-transform">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-purple-800 bg-white px-3 py-1 rounded-full border border-purple-300 shadow-sm">Semana</span>
            </div>
            <p className="text-3xl font-bold text-purple-900 tabular-nums mb-2">S/{weekTotal.toFixed(2)}</p>
            <p className="text-sm text-purple-700 font-medium">Últimos 7 días</p>
          </div>
        </div>

        {/* Month Income */}
        <div className="relative overflow-hidden rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-50 to-amber-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-100/50 to-amber-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 border-2 border-amber-600 shadow-lg group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-amber-800 bg-white px-3 py-1 rounded-full border border-amber-300 shadow-sm">Mes</span>
            </div>
            <p className="text-3xl font-bold text-amber-900 tabular-nums mb-2">S/{monthTotal.toFixed(2)}</p>
            <p className="text-sm text-amber-700 font-medium">Últimos 30 días</p>
          </div>
        </div>
      </div>

      {/* Second Row - 4 Additional Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Average Sale */}
        <div className="relative overflow-hidden rounded-xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/50 to-indigo-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 border-2 border-indigo-600 shadow-lg group-hover:scale-110 transition-transform">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-indigo-800 bg-white px-3 py-1 rounded-full border border-indigo-300 shadow-sm">Promedio</span>
            </div>
            <p className="text-3xl font-bold text-indigo-900 tabular-nums mb-2">S/{averageSale.toFixed(2)}</p>
            <p className="text-sm text-indigo-700 font-medium">Ticket promedio</p>
          </div>
        </div>

        {/* Trend */}
        <div className="relative overflow-hidden rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/50 to-emerald-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 border-2 border-emerald-600 shadow-lg group-hover:scale-110 transition-transform">
                {trend >= 0 ? <ArrowUp className="h-6 w-6 text-white" /> : <ArrowDown className="h-6 w-6 text-white" />}
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-300 shadow-sm">Tendencia</span>
            </div>
            <p className="text-3xl font-bold text-emerald-900 tabular-nums mb-2">
              {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
            </p>
            <p className="text-sm text-emerald-700 font-medium">vs mes anterior</p>
          </div>
        </div>

        {/* Cash Payments */}
        <div className="relative overflow-hidden rounded-xl border-2 border-orange-500/30 bg-gradient-to-br from-orange-50 to-orange-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-100/50 to-orange-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 border-2 border-orange-600 shadow-lg group-hover:scale-110 transition-transform">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-orange-800 bg-white px-3 py-1 rounded-full border border-orange-300 shadow-sm">Efectivo</span>
            </div>
            <p className="text-3xl font-bold text-orange-900 tabular-nums mb-2">{cashPayments}</p>
            <p className="text-sm text-orange-700 font-medium">Pagos en efectivo</p>
          </div>
        </div>

        {/* Best Day */}
        <div className="relative overflow-hidden rounded-xl border-2 border-pink-500/30 bg-gradient-to-br from-pink-50 to-pink-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-100/50 to-pink-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 border-2 border-pink-600 shadow-lg group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-pink-800 bg-white px-3 py-1 rounded-full border border-pink-300 shadow-sm">Mejor</span>
            </div>
            <p className="text-lg font-bold text-pink-900 tabular-nums mb-1 truncate">
              {bestDay[0] ? new Date(bestDay[0]).toLocaleDateString('es', { day: 'numeric', month: 'short' }) : 'N/A'}
            </p>
            <p className="text-sm text-pink-700 font-medium">
              S/{bestDay[1].toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
