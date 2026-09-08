import { FileText, AlertCircle, User, Clock, TrendingUp, Fingerprint, Activity, Monitor } from 'lucide-react';
import { subDays } from 'date-fns';
import { KPICard } from '@/components/ui/KPICard';

interface AuditRow {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  before: unknown;
  after: unknown;
  device: string | null;
  ipAddress: string | null;
  createdAt: string;
}

interface AuditMetricsProps {
  data: AuditRow[];
  dateFrom: Date;
  dateTo: Date;
}

export function AuditMetrics({ data, dateFrom, dateTo }: AuditMetricsProps) {
  const totalAudits = data.length;
  
  const criticalActions = data.filter(row => 
    row.action === 'DELETE' || 
    row.action === 'RESET_PASSWORD' || 
    row.action === 'UNLOCK' ||
    row.action === 'LOCK_USER' ||
    row.action === 'CHANGE_ROLE'
  );

  const sessionActivities = data.filter(row => 
    row.action === 'LOGIN' || 
    row.action === 'LOGOUT'
  );

  const oneHourAgo = subDays(new Date(), 1/24);
  const recentAudits = data.filter(row => 
    new Date(row.createdAt) >= oneHourAgo
  );

  const actionBreakdown = data.reduce((acc, row) => {
    acc[row.action] = (acc[row.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const uniqueIPs = new Set(data.map(row => row.ipAddress).filter(Boolean)).size;
  const uniqueUsers = new Set(data.map(row => row.userId)).size;

  const mostCommonAction = Object.entries(actionBreakdown).reduce((best, [action, count]) => 
    count > best.count ? { action, count } : best
  , { action: '', count: 0 });

  const timeDiffHours = (dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60);
  const activityRate = timeDiffHours > 0 ? totalAudits / timeDiffHours : 0;

  const getActionName = (action: string) => {
    switch (action) {
      case 'LOGIN': return 'Inicios sesión';
      case 'LOGOUT': return 'Cierres sesión';
      case 'CREATE': return 'Creaciones';
      case 'UPDATE': return 'Actualizaciones';
      case 'DELETE': return 'Eliminaciones';
      case 'RESET_PASSWORD': return 'Reseteos clave';
      case 'LOCK_USER': return 'Bloqueos';
      case 'UNLOCK': return 'Desbloqueos';
      case 'CHANGE_ROLE': return 'Cambios rol';
      default: return action || 'Ninguna';
    }
  };

  return (
    <div className="space-y-4 mb-6">
      {/* First Row - 4 Core Audit Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Registros"
          value={totalAudits.toLocaleString()}
          description="Movimientos registrados"
          color="blue"
          icon={<FileText className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Acciones Críticas"
          value={criticalActions.length}
          description="Borrado, roles y passwords"
          color="red"
          critical={criticalActions.length > 0}
          icon={<AlertCircle className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Sesiones"
          value={sessionActivities.length}
          description="Inicios y cierres de sesión"
          color="green"
          icon={<User className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Última Hora"
          value={recentAudits.length}
          description="Actividad reciente"
          color="purple"
          icon={<Clock className="h-6 w-6 text-white" />}
        />
      </div>

      {/* Second Row - 4 Additional Audit Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Frecuencia Horaria"
          value={activityRate.toFixed(1)}
          description="Registros por hora"
          color="teal"
          icon={<TrendingUp className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Usuarios Únicos"
          value={uniqueUsers}
          description="Cuentas activas en período"
          color="indigo"
          icon={<Fingerprint className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Acción Frecuente"
          value={getActionName(mostCommonAction.action)}
          subtitle={`${mostCommonAction.count} ejecuciones`}
          description="Operación más repetida"
          color="pink"
          icon={<Activity className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Direcciones IP"
          value={uniqueIPs}
          description="Orígenes de conexión únicos"
          color="amber"
          icon={<Monitor className="h-6 w-6 text-white" />}
        />
      </div>
    </div>
  );
}
