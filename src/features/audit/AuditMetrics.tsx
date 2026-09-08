import { FileText, AlertCircle, Shield, Clock, TrendingUp, Eye } from 'lucide-react';
import { subDays, isToday } from 'date-fns';
import type { AuditLog } from '@/types/audit';
import { isCriticalAction } from '@/types/audit';
import { KPICard } from '@/components/ui/KPICard';

interface AuditMetricsProps {
  data: AuditLog[];
  dateFrom: Date;
  dateTo: Date;
}

export function AuditMetrics({ data, dateFrom, dateTo }: AuditMetricsProps) {
  const totalAudits = data.length;
  
  const criticalActions = data.filter(row => 
    isCriticalAction(row.action)
  );

  const sessionActivities = data.filter(row => 
    row.action === 'LOGIN' || 
    row.action === 'LOGOUT'
  );

  const failedLogins = data.filter(row => 
    row.action.includes('FAILED') || 
    (row.action === 'LOGIN' && row.entity === 'FAILED_ATTEMPT')
  );

  const businessOperations = data.filter(row => 
    ['Sale', 'Service', 'Client', 'Appointment'].includes(row.entity) &&
    ['CREATE', 'UPDATE', 'CANCEL'].some(action => row.action.includes(action))
  );

  const oneHourAgo = subDays(new Date(), 1/24);
  const recentAudits = data.filter(row => 
    new Date(row.createdAt) >= oneHourAgo
  );

  const suspiciousActivities = data.filter(row => {
    const auditHour = new Date(row.createdAt).getHours();
    const isAfterHours = auditHour >= 22 || auditHour <= 6;
    return isCriticalAction(row.action) && isAfterHours;
  });

  const hourlyActivity = data.reduce((acc, row) => {
    const hour = new Date(row.createdAt).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  const peakHour = Object.entries(hourlyActivity).reduce((best, [hour, count]) => 
    count > best.count ? { hour: parseInt(hour), count } : best
  , { hour: 0, count: 0 });

  return (
    <div className="space-y-4 mb-6">
      {/* First Row - 4 Core Audit Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Registros"
          value={totalAudits.toLocaleString()}
          description="Auditorías registradas"
          color="blue"
          icon={<FileText className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Acciones Críticas"
          value={criticalActions.length}
          description="Eliminaciones y cambios clave"
          color="red"
          critical={criticalActions.length > 0}
          icon={<AlertCircle className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Sesiones"
          value={sessionActivities.length}
          description="Logins y logouts de usuarios"
          color="green"
          icon={<Shield className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Última Hora"
          value={recentAudits.length}
          description="Eventos recientes"
          color="purple"
          icon={<Clock className="h-6 w-6 text-white" />}
        />
      </div>

      {/* Second Row - 4 Additional Audit Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Fallos de Acceso"
          value={failedLogins.length}
          description="Intentos bloqueados"
          color="red"
          critical={failedLogins.length > 0}
          icon={<AlertCircle className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Operaciones Clave"
          value={businessOperations.length}
          description="Ventas, citas y clientes"
          color="teal"
          icon={<TrendingUp className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Sospechosas"
          value={suspiciousActivities.length}
          description="Fuera de horario laboral"
          color="amber"
          critical={suspiciousActivities.length > 0}
          icon={<Eye className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Hora Pico"
          value={`${peakHour.hour}:00`}
          subtitle={`${peakHour.count} acciones`}
          description="Mayor tráfico del sistema"
          color="indigo"
          icon={<Clock className="h-6 w-6 text-white" />}
        />
      </div>
    </div>
  );
}
