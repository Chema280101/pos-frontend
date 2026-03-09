import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, CheckCircle, Clock, XCircle, Award, Target, BarChart3, Star, Zap, CreditCard, Building2, Receipt } from 'lucide-react';
import { format, startOfDay, endOfDay, subDays, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { es } from 'date-fns/locale';

interface Commission {
  id: string;
  amount: number;
  pctApplied: number;
  status: string;
  paidAt: string | null;
  paymentMethod: string | null;
  paymentNotes: string | null;
  createdAt: string;
  user: { id: string; name: string; unit: string | null };
  sale: { id: string; saleNumber: string; unit: string; total: number; createdAt: string } | null;
}

interface CommissionsMetricsProps {
  commissions: Commission[];
}

export function CommissionsMetrics({ commissions }: CommissionsMetricsProps) {
  // Today's commissions
  const today = new Date();
  const todayCommissions = commissions.filter(commission => {
    const commissionDate = new Date(commission.createdAt);
    return isToday(commissionDate);
  });

  // This week commissions
  const weekCommissions = commissions.filter(commission => {
    const commissionDate = new Date(commission.createdAt);
    return isThisWeek(commissionDate, { weekStartsOn: 1 });
  });

  // This month commissions
  const monthCommissions = commissions.filter(commission => {
    const commissionDate = new Date(commission.createdAt);
    return isThisMonth(commissionDate);
  });

  // Status breakdown
  const paidCommissions = commissions.filter(commission => commission.status === 'PAID');
  const pendingCommissions = commissions.filter(commission => commission.status === 'PENDING');
  const cancelledCommissions = commissions.filter(commission => commission.status === 'CANCELLED');

  // Unit breakdown
  const barberiaCommissions = commissions.filter(commission => 
    commission.user.unit === 'BARBERIA' || commission.sale?.unit === 'BARBERIA'
  );
  const spaCommissions = commissions.filter(commission => 
    commission.user.unit === 'SPA' || commission.sale?.unit === 'SPA'
  );

  // Financial metrics
  const totalCommissions = commissions.reduce((sum, commission) => sum + commission.amount, 0);
  const avgCommissionAmount = commissions.length > 0 ? totalCommissions / commissions.length : 0;
  const avgCommissionRate = commissions.length > 0 
    ? commissions.reduce((sum, commission) => sum + commission.pctApplied, 0) / commissions.length 
    : 0;

  // Performance metrics
  const commissionsWithSales = commissions.filter(commission => commission.sale !== null);
  const topPerformers = commissions.reduce((acc, commission) => {
    const userName = commission.user.name;
    acc[userName] = (acc[userName] || 0) + commission.amount;
    return acc;
  }, {} as Record<string, number>);
  
  const bestPerformer = Object.entries(topPerformers).reduce((best, [name, amount]) => 
    amount > best.amount ? { name, amount } : best
  , { name: '', amount: 0 });

  // Payment method breakdown
  const cashPayments = commissions.filter(commission => commission.paymentMethod === 'CASH').length;
  const transferPayments = commissions.filter(commission => commission.paymentMethod === 'TRANSFER').length;
  const otherPayments = commissions.filter(commission => 
    commission.paymentMethod && commission.paymentMethod !== 'CASH' && commission.paymentMethod !== 'TRANSFER'
  ).length;

  // Best payment method
  const paymentMethods = [
    { name: 'Efectivo', count: cashPayments },
    { name: 'Transferencia', count: transferPayments },
    { name: 'Otros', count: otherPayments }
  ];
  const bestPaymentMethod = paymentMethods.reduce((best, method) => 
    method.count > best.count ? method : best
  , paymentMethods[0]);

  // Best performing unit
  const barberiaTotal = barberiaCommissions.reduce((sum, commission) => sum + commission.amount, 0);
  const spaTotal = spaCommissions.reduce((sum, commission) => sum + commission.amount, 0);
  const bestUnit = barberiaTotal > spaTotal ? 'BARBERIA' : 'SPA';
  const bestUnitRevenue = Math.max(barberiaTotal, spaTotal);

  return (
    <>
      {/* First Row - 4 Core Commissions Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Commissions */}
        <div className="relative overflow-hidden rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-50 to-blue-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-blue-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-blue-600 shadow-lg group-hover:scale-110 transition-transform">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-blue-800 bg-white px-3 py-1 rounded-full border border-blue-300 shadow-sm">Total</span>
            </div>
            <p className="text-3xl font-bold text-blue-900 tabular-nums mb-2">{commissions.length}</p>
            <p className="text-sm text-blue-700 font-medium">Comisiones totales</p>
          </div>
        </div>

        {/* Today's Commissions */}
        <div className="relative overflow-hidden rounded-xl border-2 border-green-500/30 bg-gradient-to-br from-green-50 to-green-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-green-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 border-2 border-green-600 shadow-lg group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-green-800 bg-white px-3 py-1 rounded-full border border-green-300 shadow-sm">Hoy</span>
            </div>
            <p className="text-3xl font-bold text-green-900 tabular-nums mb-2">{todayCommissions.length}</p>
            <p className="text-sm text-green-700 font-medium">Comisiones hoy</p>
          </div>
        </div>

        {/* Paid Commissions */}
        <div className="relative overflow-hidden rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/50 to-emerald-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 border-2 border-emerald-600 shadow-lg group-hover:scale-110 transition-transform">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-300 shadow-sm">Pagadas</span>
            </div>
            <p className="text-3xl font-bold text-emerald-900 tabular-nums mb-2">{paidCommissions.length}</p>
            <p className="text-sm text-emerald-700 font-medium">Comisiones pagadas</p>
          </div>
        </div>

        {/* Total Amount */}
        <div className="relative overflow-hidden rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-50 to-purple-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-purple-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-purple-600 shadow-lg group-hover:scale-110 transition-transform">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-purple-800 bg-white px-3 py-1 rounded-full border border-purple-300 shadow-sm">Monto</span>
            </div>
            <p className="text-3xl font-bold text-purple-900 tabular-nums mb-2">S/{Number(totalCommissions || 0).toFixed(2)}</p>
            <p className="text-sm text-purple-700 font-medium">Monto total</p>
          </div>
        </div>
      </div>

      {/* Second Row - 4 Additional Commissions Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Pending Commissions */}
        <div className="relative overflow-hidden rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-50 to-amber-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-100/50 to-amber-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 border-2 border-amber-600 shadow-lg group-hover:scale-110 transition-transform">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-amber-800 bg-white px-3 py-1 rounded-full border border-amber-300 shadow-sm">Pendientes</span>
            </div>
            <p className="text-3xl font-bold text-amber-900 tabular-nums mb-2">{pendingCommissions.length}</p>
            <p className="text-sm text-amber-700 font-medium">Comisiones pendientes</p>
          </div>
        </div>

        {/* Average Commission */}
        <div className="relative overflow-hidden rounded-xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/50 to-indigo-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 border-2 border-indigo-600 shadow-lg group-hover:scale-110 transition-transform">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-indigo-800 bg-white px-3 py-1 rounded-full border border-indigo-300 shadow-sm">Promedio</span>
            </div>
            <p className="text-3xl font-bold text-indigo-900 tabular-nums mb-2">S/{Number(avgCommissionAmount || 0).toFixed(2)}</p>
            <p className="text-sm text-indigo-700 font-medium">Comisión promedio</p>
          </div>
        </div>

        {/* Best Performer */}
        <div className="relative overflow-hidden rounded-xl border-2 border-pink-500/30 bg-gradient-to-br from-pink-50 to-pink-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-100/50 to-pink-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 border-2 border-pink-600 shadow-lg group-hover:scale-110 transition-transform">
                <Award className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-pink-800 bg-white px-3 py-1 rounded-full border border-pink-300 shadow-sm">Mejor</span>
            </div>
            <p className="text-lg font-bold text-pink-900 tabular-nums mb-1 truncate">
              {bestPerformer.name || 'N/A'}
            </p>
            <p className="text-sm text-pink-700 font-medium">
              S/{bestPerformer.amount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Best Unit */}
        <div className="relative overflow-hidden rounded-xl border-2 border-teal-500/30 bg-gradient-to-br from-teal-50 to-teal-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-100/50 to-teal-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 border-2 border-teal-600 shadow-lg group-hover:scale-110 transition-transform">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-teal-800 bg-white px-3 py-1 rounded-full border border-teal-300 shadow-sm">Unidad</span>
            </div>
            <p className="text-lg font-bold text-teal-900 tabular-nums mb-1 truncate">
              {bestUnit === 'BARBERIA' ? 'Barbería' : 'SPA'}
            </p>
            <p className="text-sm text-teal-700 font-medium">
              S/{Number(bestUnitRevenue || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
