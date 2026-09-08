import { DollarSign, Calendar, CheckCircle, Clock, Award, BarChart3, Building2, Receipt } from 'lucide-react';
import { isToday, isThisWeek, isThisMonth } from 'date-fns';
import type { GroupedCommission } from '@/types/commission';
import { KPICard } from '@/components/ui/KPICard';

interface CommissionsMetricsProps {
  commissions: GroupedCommission[];
}

export function CommissionsMetrics({ commissions }: CommissionsMetricsProps) {
  const today = new Date();
  const todayCommissions = commissions.filter(commission => {
    const commissionDate = new Date(commission.createdAt);
    return isToday(commissionDate);
  });

  const paidCommissions = commissions.filter(commission => commission.status === 'PAID');
  const pendingCommissions = commissions.filter(commission => commission.status === 'PENDING');

  const barberiaCommissions = commissions.filter(commission => 
    commission.userUnit === 'BARBERIA' || commission.user.unit === 'BARBERIA'
  );
  const spaCommissions = commissions.filter(commission => 
    commission.userUnit === 'SPA' || commission.user.unit === 'SPA'
  );

  const totalCommissions = commissions.reduce((sum, commission) => sum + commission.totalAmount, 0);
  const avgCommissionAmount = commissions.length > 0 ? totalCommissions / commissions.length : 0;

  const topPerformers = commissions.reduce((acc, commission) => {
    const userName = commission.userName || commission.user.name;
    acc[userName] = (acc[userName] || 0) + commission.totalAmount;
    return acc;
  }, {} as Record<string, number>);
  
  const bestPerformer = Object.entries(topPerformers).reduce((best, [name, amount]) => 
    amount > best.amount ? { name, amount } : best
  , { name: '', amount: 0 });

  const barberiaTotal = barberiaCommissions.reduce((sum, commission) => sum + commission.totalAmount, 0);
  const spaTotal = spaCommissions.reduce((sum, commission) => sum + commission.totalAmount, 0);
  const bestUnit = barberiaTotal >= spaTotal ? 'Barbería' : 'SPA';
  const bestUnitRevenue = Math.max(barberiaTotal, spaTotal);

  return (
    <div className="space-y-4 mb-6">
      {/* First Row - 4 Core Commissions Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Comisiones"
          value={commissions.length}
          description="Liquidaciones registradas"
          color="blue"
          icon={<DollarSign className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Generadas Hoy"
          value={todayCommissions.length}
          description="Comisiones de la fecha"
          color="green"
          icon={<Calendar className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Pagadas"
          value={paidCommissions.length}
          description="Comisiones liquidadas"
          color="teal"
          icon={<CheckCircle className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Monto Total"
          value={totalCommissions.toFixed(2)}
          unit="S/"
          description="Valor total acumulado"
          color="purple"
          icon={<Receipt className="h-6 w-6 text-white" />}
        />
      </div>

      {/* Second Row - 4 Additional Commissions Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Pendientes de Pago"
          value={pendingCommissions.length}
          description="Por liquidar al personal"
          color="amber"
          critical={pendingCommissions.length > 0}
          icon={<Clock className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Ticket Promedio"
          value={avgCommissionAmount.toFixed(2)}
          unit="S/"
          description="Promedio por liquidación"
          color="indigo"
          icon={<BarChart3 className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Top Especialista"
          value={bestPerformer.name || 'N/A'}
          subtitle={`S/ ${bestPerformer.amount.toFixed(2)}`}
          description="Mayor ganancia en comisiones"
          color="pink"
          icon={<Award className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Unidad Principal"
          value={bestUnit}
          subtitle={`S/ ${bestUnitRevenue.toFixed(2)}`}
          description="Unidad con mayor comisión"
          color="green"
          icon={<Building2 className="h-6 w-6 text-white" />}
        />
      </div>
    </div>
  );
}
