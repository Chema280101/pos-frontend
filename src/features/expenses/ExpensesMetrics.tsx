import { TrendingDown, Calendar, BarChart3, Receipt, ShoppingCart, Activity, AlertTriangle, TrendingUp } from 'lucide-react';
import { KPICard } from '@/components/ui/KPICard';

// Helper function to translate category names
const translateCategory = (category: string): string => {
  const translations: Record<string, string> = {
    'other': 'Otros',
    'others': 'Otros',
    'supplies': 'Insumos',
    'services': 'Servicios',
    'maintenance': 'Mantenimiento',
    'rent': 'Alquiler',
    'utilities': 'Servicios básicos',
    'marketing': 'Marketing',
    'office': 'Oficina',
    'comisiones': 'Comisiones',
  };
  return translations[category.toLowerCase()] || category;
};

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
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const total = safeExpenses.reduce((sum, e) => sum + e.amount, 0);
  const today = new Date();
  const todayExpenses = safeExpenses.filter(e => {
    const expenseDate = new Date(e.createdAt);
    return expenseDate.toDateString() === today.toDateString();
  });
  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  // This week (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekExpenses = safeExpenses.filter(e => new Date(e.createdAt) >= weekAgo);
  const weekTotal = weekExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  // This month (last 30 days)
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthExpenses = safeExpenses.filter(e => new Date(e.createdAt) >= monthAgo);
  const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Additional metrics
  const averageExpense = safeExpenses.length > 0 ? total / safeExpenses.length : 0;
  
  // Category breakdown
  const categoryTotals = safeExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
  const topCategory = Object.entries(categoryTotals).reduce((max, [category, total]) => 
    total > max[1] ? [category, total] : max, ['', 0]);
  
  // Trend calculation (compare with previous period)
  const previousMonthAgo = new Date();
  previousMonthAgo.setDate(previousMonthAgo.getDate() - 60);
  const previousMonthExpenses = safeExpenses.filter(e => {
    const date = new Date(e.createdAt);
    return date >= previousMonthAgo && date < monthAgo;
  });
  const previousMonthTotal = previousMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const trend = previousMonthTotal > 0 ? ((monthTotal - previousMonthTotal) / previousMonthTotal) * 100 : 0;
  
  // Worst day (highest expense day)
  const dailyTotals = safeExpenses.reduce((acc, expense) => {
    const date = new Date(expense.createdAt).toDateString();
    acc[date] = (acc[date] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
  const worstDay = Object.entries(dailyTotals).reduce((max, [date, total]) => 
    total > max[1] ? [date, total] : max, ['', 0]);

  return (
    <div className="space-y-4 mb-6">
      {/* First Row - 4 Primary Expense Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Gastos Totales"
          value={total.toFixed(2)}
          unit="S/"
          description="Egresos acumulados"
          color="red"
          critical={total > 0}
          icon={<TrendingDown className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Gastos de Hoy"
          value={todayTotal.toFixed(2)}
          unit="S/"
          description="Egresos de la jornada"
          color="amber"
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
          color="pink"
          icon={<Receipt className="h-6 w-6 text-white" />}
        />
      </div>

      {/* Second Row - 4 Additional Expense Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Gasto Promedio"
          value={averageExpense.toFixed(2)}
          unit="S/"
          description="Ticket promedio de egreso"
          color="indigo"
          icon={<Activity className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Tendencia Mensual"
          value={`${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`}
          description="vs mes anterior"
          color={trend <= 0 ? 'green' : 'amber'}
          icon={<TrendingUp className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Mayor Rubro"
          value={translateCategory(topCategory[0]) || 'N/A'}
          subtitle={`S/ ${topCategory[1].toFixed(2)}`}
          description="Categoría principal"
          color="teal"
          icon={<ShoppingCart className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Día Crítico"
          value={worstDay[0] ? new Date(worstDay[0]).toLocaleDateString('es', { day: 'numeric', month: 'short' }) : 'N/A'}
          subtitle={`S/ ${worstDay[1].toFixed(2)}`}
          description="Mayor gasto en 1 día"
          color="red"
          icon={<AlertTriangle className="h-6 w-6 text-white" />}
        />
      </div>
    </div>
  );
}
