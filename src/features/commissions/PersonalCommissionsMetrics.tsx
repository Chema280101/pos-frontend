import { DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import type { Commission } from '@/types/commission';
import { KPICard } from '@/components/ui/KPICard';

interface PersonalCommissionsMetricsProps {
  commissions: Commission[];
}

export function PersonalCommissionsMetrics({ commissions }: PersonalCommissionsMetricsProps) {
  const paidCommissions = commissions.filter(commission => commission.status === 'PAID');
  const pendingCommissions = commissions.filter(commission => commission.status === 'PENDING');

  const totalEarned = commissions.reduce((sum, commission) => sum + commission.amount, 0);
  const totalPending = pendingCommissions.reduce((sum, commission) => sum + commission.amount, 0);
  const totalPaid = paidCommissions.reduce((sum, commission) => sum + commission.amount, 0);
  const avgCommissionAmount = commissions.length > 0 ? totalEarned / commissions.length : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <KPICard
        title="Total Ganado"
        value={totalEarned.toFixed(2)}
        unit="S/"
        description="Histórico acumulado"
        color="blue"
        icon={<DollarSign className="h-6 w-6 text-white" />}
      />
      <KPICard
        title="Por Cobrar"
        value={totalPending.toFixed(2)}
        unit="S/"
        description="Pendiente de liquidación"
        color="amber"
        critical={totalPending > 0}
        icon={<Clock className="h-6 w-6 text-white" />}
      />
      <KPICard
        title="Cobrado"
        value={totalPaid.toFixed(2)}
        unit="S/"
        description="Liquidado y pagado"
        color="green"
        icon={<CheckCircle className="h-6 w-6 text-white" />}
      />
      <KPICard
        title="Promedio por Venta"
        value={avgCommissionAmount.toFixed(2)}
        unit="S/"
        description="Comisión media"
        color="purple"
        icon={<TrendingUp className="h-6 w-6 text-white" />}
      />
    </div>
  );
}
