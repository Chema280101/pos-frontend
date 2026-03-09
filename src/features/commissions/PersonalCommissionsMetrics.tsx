import { DollarSign, TrendingUp, Calendar, Clock, CheckCircle, AlertCircle, Target, Award, BarChart3 } from 'lucide-react';
import { format, startOfDay, endOfDay, subDays, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Commission } from '@/types/commission';

interface PersonalCommissionsMetricsProps {
  commissions: Commission[];
}

export function PersonalCommissionsMetrics({ commissions }: PersonalCommissionsMetricsProps) {
  // Today's commissions
  const today = new Date();
  const todayCommissions = commissions.filter(commission => {
    const commissionDate = new Date(commission.paidAt || commission.sale?.createdAt || new Date());
    return isToday(commissionDate);
  });

  // This week commissions
  const weekCommissions = commissions.filter(commission => {
    const commissionDate = new Date(commission.paidAt || commission.sale?.createdAt || new Date());
    return isThisWeek(commissionDate, { weekStartsOn: 1 });
  });

  // This month commissions
  const monthCommissions = commissions.filter(commission => {
    const commissionDate = new Date(commission.paidAt || commission.sale?.createdAt || new Date());
    return isThisMonth(commissionDate);
  });

  // Status breakdown
  const paidCommissions = commissions.filter(commission => commission.status === 'PAID');
  const pendingCommissions = commissions.filter(commission => commission.status === 'PENDING');
  const approvedCommissions = commissions.filter(commission => commission.status === 'APPROVED');

  // Financial metrics
  const totalEarned = commissions.reduce((sum, commission) => sum + commission.amount, 0);
  const totalPending = pendingCommissions.reduce((sum, commission) => sum + commission.amount, 0);
  const totalPaid = paidCommissions.reduce((sum, commission) => sum + commission.amount, 0);
  const avgCommissionAmount = commissions.length > 0 ? totalEarned / commissions.length : 0;

  // Performance metrics
  const commissionsWithSales = commissions.filter(commission => commission.sale !== null);
  const avgCommissionRate = commissions.length > 0 
    ? commissions.reduce((sum, commission) => sum + commission.pctApplied, 0) / commissions.length 
    : 0;

  // Best performing day
  const performanceByDay = commissions.reduce((acc, commission) => {
    const day = format(new Date(commission.paidAt || commission.sale?.createdAt || new Date()), 'EEEE', { locale: es });
    acc[day] = (acc[day] || 0) + commission.amount;
    return acc;
  }, {} as Record<string, number>);
  
  const bestDay = Object.entries(performanceByDay).reduce((best, [day, amount]) => 
    amount > best.amount ? { day, amount } : best
  , { day: '', amount: 0 });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Total Earned */}
      <div className="relative overflow-hidden rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-50 to-blue-100 p-6 hover:shadow-lg transition-all duration-300 group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-blue-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-blue-600 shadow-lg group-hover:scale-110 transition-transform">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs font-bold text-blue-800 bg-white px-3 py-1 rounded-full border border-blue-300 shadow-sm">Total</span>
          </div>
          <p className="text-3xl font-bold text-blue-900 tabular-nums mb-2">S/{Number(totalEarned || 0).toFixed(2)}</p>
          <p className="text-sm text-blue-700 font-medium">Total ganado</p>
        </div>
      </div>

      {/* Pending Amount */}
      <div className="relative overflow-hidden rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-50 to-amber-100 p-6 hover:shadow-lg transition-all duration-300 group">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-100/50 to-amber-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 border-2 border-amber-600 shadow-lg group-hover:scale-110 transition-transform">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs font-bold text-amber-800 bg-white px-3 py-1 rounded-full border border-amber-300 shadow-sm">Pendiente</span>
          </div>
          <p className="text-3xl font-bold text-amber-900 tabular-nums mb-2">S/{Number(totalPending || 0).toFixed(2)}</p>
          <p className="text-sm text-amber-700 font-medium">Por cobrar</p>
        </div>
      </div>

      {/* Paid Amount */}
      <div className="relative overflow-hidden rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 hover:shadow-lg transition-all duration-300 group">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/50 to-emerald-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 border-2 border-emerald-600 shadow-lg group-hover:scale-110 transition-transform">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-300 shadow-sm">Pagado</span>
          </div>
          <p className="text-3xl font-bold text-emerald-900 tabular-nums mb-2">S/{Number(totalPaid || 0).toFixed(2)}</p>
          <p className="text-sm text-emerald-700 font-medium">Ya cobrado</p>
        </div>
      </div>

      {/* Average Commission */}
      <div className="relative overflow-hidden rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-50 to-purple-100 p-6 hover:shadow-lg transition-all duration-300 group">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-purple-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-purple-600 shadow-lg group-hover:scale-110 transition-transform">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs font-bold text-purple-800 bg-white px-3 py-1 rounded-full border border-purple-300 shadow-sm">Promedio</span>
          </div>
          <p className="text-3xl font-bold text-purple-900 tabular-nums mb-2">S/{Number(avgCommissionAmount || 0).toFixed(2)}</p>
          <p className="text-sm text-purple-700 font-medium">Por comisión</p>
        </div>
      </div>
    </div>
  );
}
