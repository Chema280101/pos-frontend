import { TrendingUp, TrendingDown, DollarSign, Banknote, CreditCard, Smartphone, Calendar, BarChart3, Activity, AlertTriangle, Lock, Unlock, ArrowUp, ArrowDown, Receipt, Calculator } from 'lucide-react';
import { CashRegister } from '@/types/cash';

interface CashRegisterMetricsProps {
  cashRegisters: CashRegister[];
}

export function CashRegisterMetrics({ cashRegisters }: CashRegisterMetricsProps) {
  const total = cashRegisters.length;
  const open = cashRegisters.filter(cr => cr.status === 'OPEN').length;
  const closed = cashRegisters.filter(cr => cr.status === 'CLOSED').length;
  
  // Today's registers
  const today = new Date();
  const todayRegisters = cashRegisters.filter(cr => {
    const registerDate = new Date(cr.openedAt);
    return registerDate.toDateString() === today.toDateString();
  });
  
  // Financial calculations
  const totalOpeningAmount = cashRegisters.reduce((sum, cr) => {
    const amount = Number(cr.openingAmount) || 0;
    return sum + amount;
  }, 0);
  
  const totalClosingDeclared = cashRegisters.reduce((sum, cr) => {
    const amount = Number(cr.closingDeclared) || 0;
    return sum + amount;
  }, 0);
  
  const totalExpenses = cashRegisters.reduce((sum, cr) => {
    const expenses = cr.expenses || [];
    const expensesSum = expenses.reduce((eSum, e) => eSum + (e.amount || 0), 0);
    return sum + expensesSum;
  }, 0);

  // Calculate total sales from individual sales (cash + card + transfer + wallet + cash entries)
  const totalSales = cashRegisters.reduce((sum, cr) => {
    const sales = cr.sales || [];
    const salesSum = sales.reduce((sSum, sale) => {
      // Sum all payment methods and cash entries
      const cash = sale.cash || 0;
      const card = sale.card || 0;
      const transfer = sale.transfer || 0;
      const wallet = sale.wallet || 0;
      const cashEntries = sale.cashEntries || 0;
      return sSum + cash + card + transfer + wallet + cashEntries;
    }, 0);
    return sum + salesSum;
  }, 0);

  // Average per register
  const averageOpening = total > 0 ? totalOpeningAmount / total : 0;
  
  // Unit breakdown
  const barberiaRegisters = cashRegisters.filter(cr => cr.unit === 'BARBERIA');
  const spaRegisters = cashRegisters.filter(cr => cr.unit === 'SPA');
  const barberiaCount = barberiaRegisters.length;
  const spaCount = spaRegisters.length;
  
  // Best performing register (by opening amount)
  const bestRegister = cashRegisters.length > 0 ? 
    cashRegisters.reduce((max, cr) => Number(cr.openingAmount) > Number(max.openingAmount) ? cr : max, cashRegisters[0]) : null;
  
  // Today's performance
  const todayOpening = todayRegisters.reduce((sum, cr) => {
    const amount = Number(cr.openingAmount) || 0;
    return sum + amount;
  }, 0);

  // Cash percentage (simplified calculation)
  const cashPercentage = totalSales > 0 ? 100 : 0; // Simplified

  return (
    <>
      {/* First Row - 4 Primary Cash Register Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Registers */}
        <div className="relative overflow-hidden rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-50 to-blue-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-blue-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-blue-600 shadow-lg group-hover:scale-110 transition-transform">
                <Banknote className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-blue-800 bg-white px-3 py-1 rounded-full border border-blue-300 shadow-sm">Total</span>
            </div>
            <p className="text-3xl font-bold text-blue-900 tabular-nums mb-2">{total}</p>
            <p className="text-sm text-blue-700 font-medium">Cajas totales</p>
          </div>
        </div>

        {/* Open Registers */}
        <div className="relative overflow-hidden rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/50 to-emerald-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 border-2 border-emerald-600 shadow-lg group-hover:scale-110 transition-transform">
                <Unlock className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-300 shadow-sm">Abiertas</span>
            </div>
            <p className="text-3xl font-bold text-emerald-900 tabular-nums mb-2">{open}</p>
            <p className="text-sm text-emerald-700 font-medium">Cajas abiertas</p>
          </div>
        </div>

        {/* Total Profit */}
        <div className="relative overflow-hidden rounded-xl border-2 border-green-500/30 bg-gradient-to-br from-green-50 to-green-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-green-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 border-2 border-green-600 shadow-lg group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-green-800 bg-white px-3 py-1 rounded-full border border-green-300 shadow-sm">Ganancia</span>
            </div>
            <p className="text-3xl font-bold text-green-900 tabular-nums mb-2">S/{Number((totalSales || 0) - totalExpenses).toFixed(2)}</p>
            <p className="text-sm text-green-700 font-medium">Ganancia neta</p>
          </div>
        </div>

        {/* Today's Opening */}
        <div className="relative overflow-hidden rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-50 to-purple-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-purple-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-purple-600 shadow-lg group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-purple-800 bg-white px-3 py-1 rounded-full border border-purple-300 shadow-sm">Hoy</span>
            </div>
            <p className="text-3xl font-bold text-purple-900 tabular-nums mb-2">S/{Number(todayOpening || 0).toFixed(2)}</p>
            <p className="text-sm text-purple-700 font-medium">Apertura hoy</p>
          </div>
        </div>
      </div>

      {/* Second Row - 4 Additional Cash Register Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Average Opening */}
        <div className="relative overflow-hidden rounded-xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/50 to-indigo-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 border-2 border-indigo-600 shadow-lg group-hover:scale-110 transition-transform">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-indigo-800 bg-white px-3 py-1 rounded-full border border-indigo-300 shadow-sm">Promedio</span>
            </div>
            <p className="text-3xl font-bold text-indigo-900 tabular-nums mb-2">S/{Number(averageOpening || 0).toFixed(2)}</p>
            <p className="text-sm text-indigo-700 font-medium">Apertura por caja</p>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="relative overflow-hidden rounded-xl border-2 border-orange-500/30 bg-gradient-to-br from-orange-50 to-orange-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-100/50 to-orange-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 border-2 border-orange-600 shadow-lg group-hover:scale-110 transition-transform">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-orange-800 bg-white px-3 py-1 rounded-full border border-orange-300 shadow-sm">Gastos</span>
            </div>
            <p className="text-3xl font-bold text-orange-900 tabular-nums mb-2">S/{Number(totalExpenses || 0).toFixed(2)}</p>
            <p className="text-sm text-orange-700 font-medium">Gastos totales</p>
          </div>
        </div>

        {/* Barbería Count */}
        <div className="relative overflow-hidden rounded-xl border-2 border-pink-500/30 bg-gradient-to-br from-pink-50 to-pink-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-100/50 to-pink-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 border-2 border-pink-600 shadow-lg group-hover:scale-110 transition-transform">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-pink-800 bg-white px-3 py-1 rounded-full border border-pink-300 shadow-sm">Barbería</span>
            </div>
            <p className="text-3xl font-bold text-pink-900 tabular-nums mb-2">{barberiaCount}</p>
            <p className="text-sm text-pink-700 font-medium">Cajas barbería</p>
          </div>
        </div>

        {/* Best Register */}
        <div className="relative overflow-hidden rounded-xl border-2 border-gray-500/30 bg-gradient-to-br from-gray-50 to-gray-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100/50 to-gray-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 border-2 border-gray-600 shadow-lg group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-gray-800 bg-white px-3 py-1 rounded-full border border-gray-300 shadow-sm">Mejor</span>
            </div>
            <p className="text-lg font-bold text-gray-900 tabular-nums mb-1 truncate">
              {bestRegister ? `${bestRegister.unit} - ${bestRegister.id.slice(-4)}` : 'N/A'}
            </p>
            <p className="text-sm text-gray-700 font-medium">
              S/{Number(bestRegister?.openingAmount || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
