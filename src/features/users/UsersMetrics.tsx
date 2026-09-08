import { Users, UserCheck, UserX, Shield, Activity, AlertTriangle, TrendingUp, Award } from 'lucide-react';
import { subDays } from 'date-fns';
import type { User } from '@/types/users';
import { KPICard } from '@/components/ui/KPICard';

interface UsersMetricsProps {
  users: User[];
}

export function UsersMetrics({ users }: UsersMetricsProps) {
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive && !u.isLocked).length;
  const lockedUsers = users.filter(u => u.isLocked).length;
  const adminUsers = users.filter(u => u.role === 'ADMIN').length;

  const usersWithFailedAttempts = users.filter(u => u.failedLoginAttempts > 0).length;
  const usersMustChangePassword = users.filter(u => u.mustChangePassword).length;
  const usersWithCommission = users.filter(u => u.commissionPct && u.commissionPct > 0).length;

  const recentUsers = users.filter(u => {
    const createdDate = new Date(u.createdAt);
    const thirtyDaysAgo = subDays(new Date(), 30);
    return createdDate >= thirtyDaysAgo;
  });

  const activityRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
  const securityRiskScore = totalUsers > 0 
    ? ((lockedUsers + usersWithFailedAttempts + usersMustChangePassword) / totalUsers) * 100 
    : 0;

  return (
    <div className="space-y-4 mb-6">
      {/* First Row - 4 Core Users Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Usuarios"
          value={totalUsers}
          description="Cuentas registradas"
          color="blue"
          icon={<Users className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Usuarios Activos"
          value={activeUsers}
          description="Habilitados en el sistema"
          color="green"
          icon={<UserCheck className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Bloqueados"
          value={lockedUsers}
          description="Accesos suspendidos"
          color="red"
          critical={lockedUsers > 0}
          icon={<UserX className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Administradores"
          value={adminUsers}
          description="Permisos totales"
          color="purple"
          icon={<Shield className="h-6 w-6 text-white" />}
        />
      </div>

      {/* Second Row - 4 Additional Users Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Tasa de Actividad"
          value={`${activityRate.toFixed(1)}%`}
          description="Usuarios en uso activo"
          color="teal"
          icon={<Activity className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Nivel de Riesgo"
          value={`${securityRiskScore.toFixed(1)}%`}
          description="Intentos fallidos / claves temp"
          color="amber"
          icon={<AlertTriangle className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Nuevos (30d)"
          value={recentUsers.length}
          description="Registrados este mes"
          color="indigo"
          icon={<TrendingUp className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Con Comisión"
          value={usersWithCommission}
          description="Especialistas comisionistas"
          color="pink"
          icon={<Award className="h-6 w-6 text-white" />}
        />
      </div>
    </div>
  );
}
