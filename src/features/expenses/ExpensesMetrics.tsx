import { TrendingDown, Calendar, DollarSign, BarChart3, Receipt, ShoppingCart, Home, Users, ArrowUp, ArrowDown, Activity, AlertTriangle, Building2 } from 'lucide-react';

interface Expense {
  id: string;
  amount: number;
  reason: string;
  category: string;
  createdAt: string;
  cashRegisterId: string;
  createdBy: {
    id: string;
    name: string;
  };
  cashRegister?: {
    id: string;
    unit: string;
    status: string;
  };
}

interface ExpensesMetricsProps {
  expenses: Expense[];
}

export function ExpensesMetrics({ expenses }: ExpensesMetricsProps) {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const today = new Date();
  const todayExpenses = expenses.filter(e => {
    const expenseDate = new Date(e.createdAt);
    return expenseDate.toDateString() === today.toDateString();
  });
  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  // This week (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekExpenses = expenses.filter(e => new Date(e.createdAt) >= weekAgo);
  const weekTotal = weekExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  // This month (last 30 days)
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthExpenses = expenses.filter(e => new Date(e.createdAt) >= monthAgo);
  const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Additional metrics
  const averageExpense = expenses.length > 0 ? total / expenses.length : 0;
  
  // Category breakdown
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
  const topCategory = Object.entries(categoryTotals).reduce((max, [category, total]) => 
    total > max[1] ? [category, total] : max, ['', 0]);
  
  // Unit breakdown
  const unitTotals = expenses.reduce((acc, expense) => {
    const unit = expense.cashRegister?.unit || 'Sin unidad';
    acc[unit] = (acc[unit] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
  const spaExpenses = unitTotals['SPA'] || 0;
  const barberiaExpenses = unitTotals['Barbería'] || 0;
  
  // Trend calculation (compare with previous period)
  const previousMonthAgo = new Date();
  previousMonthAgo.setDate(previousMonthAgo.getDate() - 60);
  const previousMonthExpenses = expenses.filter(e => {
    const date = new Date(e.createdAt);
    return date >= previousMonthAgo && date < monthAgo;
  });
  const previousMonthTotal = previousMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const trend = previousMonthTotal > 0 ? ((monthTotal - previousMonthTotal) / previousMonthTotal) * 100 : 0;
  
  // Worst day (highest expense day)
  const dailyTotals = expenses.reduce((acc, expense) => {
    const date = new Date(expense.createdAt).toDateString();
    acc[date] = (acc[date] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
  const worstDay = Object.entries(dailyTotals).reduce((max, [date, total]) => 
    total > max[1] ? [date, total] : max, ['', 0]);

  return (
    <>
      {/* First Row - 4 Primary Expense Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Expenses */}
        <div className="relative overflow-hidden rounded-xl border-2 border-red-500/30 bg-gradient-to-br from-red-50 to-red-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-red-100/50 to-red-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 border-2 border-red-600 shadow-lg group-hover:scale-110 transition-transform">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-red-800 bg-white px-3 py-1 rounded-full border border-red-300 shadow-sm">Total</span>
            </div>
            <p className="text-3xl font-bold text-red-900 tabular-nums mb-2">S/{total.toFixed(2)}</p>
            <p className="text-sm text-red-700 font-medium">Gastos totales</p>
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="relative overflow-hidden rounded-xl border-2 border-orange-500/30 bg-gradient-to-br from-orange-50 to-orange-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-100/50 to-orange-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 border-2 border-orange-600 shadow-lg group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-orange-800 bg-white px-3 py-1 rounded-full border border-orange-300 shadow-sm">Hoy</span>
            </div>
            <p className="text-3xl font-bold text-orange-900 tabular-nums mb-2">S/{todayTotal.toFixed(2)}</p>
            <p className="text-sm text-orange-700 font-medium">Gastos de hoy</p>
          </div>
        </div>

        {/* Week Expenses */}
        <div className="relative overflow-hidden rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-50 to-amber-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-100/50 to-amber-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 border-2 border-amber-600 shadow-lg group-hover:scale-110 transition-transform">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-amber-800 bg-white px-3 py-1 rounded-full border border-amber-300 shadow-sm">Semana</span>
            </div>
            <p className="text-3xl font-bold text-amber-900 tabular-nums mb-2">S/{weekTotal.toFixed(2)}</p>
            <p className="text-sm text-amber-700 font-medium">Últimos 7 días</p>
          </div>
        </div>

        {/* Month Expenses */}
        <div className="relative overflow-hidden rounded-xl border-2 border-pink-500/30 bg-gradient-to-br from-pink-50 to-pink-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-100/50 to-pink-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 border-2 border-pink-600 shadow-lg group-hover:scale-110 transition-transform">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-pink-800 bg-white px-3 py-1 rounded-full border border-pink-300 shadow-sm">Mes</span>
            </div>
            <p className="text-3xl font-bold text-pink-900 tabular-nums mb-2">S/{monthTotal.toFixed(2)}</p>
            <p className="text-sm text-pink-700 font-medium">Últimos 30 días</p>
          </div>
        </div>
      </div>

      {/* Second Row - 4 Additional Expense Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Average Expense */}
        <div className="relative overflow-hidden rounded-xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/50 to-indigo-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 border-2 border-indigo-600 shadow-lg group-hover:scale-110 transition-transform">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-indigo-800 bg-white px-3 py-1 rounded-full border border-indigo-300 shadow-sm">Promedio</span>
            </div>
            <p className="text-3xl font-bold text-indigo-900 tabular-nums mb-2">S/{averageExpense.toFixed(2)}</p>
            <p className="text-sm text-indigo-700 font-medium">Gasto promedio</p>
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

        {/* Top Category */}
        <div className="relative overflow-hidden rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-50 to-purple-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-purple-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-purple-600 shadow-lg group-hover:scale-110 transition-transform">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-purple-800 bg-white px-3 py-1 rounded-full border border-purple-300 shadow-sm">Categoría</span>
            </div>
            <p className="text-lg font-bold text-purple-900 tabular-nums mb-1 truncate">
              {topCategory[0] || 'N/A'}
            </p>
            <p className="text-sm text-purple-700 font-medium">
              S/{topCategory[1].toFixed(2)}
            </p>
          </div>
        </div>

        {/* Worst Day */}
        <div className="relative overflow-hidden rounded-xl border-2 border-gray-500/30 bg-gradient-to-br from-gray-50 to-gray-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100/50 to-gray-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 border-2 border-gray-600 shadow-lg group-hover:scale-110 transition-transform">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-gray-800 bg-white px-3 py-1 rounded-full border border-gray-300 shadow-sm">Crítico</span>
            </div>
            <p className="text-lg font-bold text-gray-900 tabular-nums mb-1 truncate">
              {worstDay[0] ? new Date(worstDay[0]).toLocaleDateString('es', { day: 'numeric', month: 'short' }) : 'N/A'}
            </p>
            <p className="text-sm text-gray-700 font-medium">
              S/{worstDay[1].toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
