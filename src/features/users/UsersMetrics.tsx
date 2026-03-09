import { Users, UserCheck, UserX, Shield, Clock, AlertTriangle, Key, Activity, TrendingUp, Building2, Calendar, Settings, Lock, Eye, Award, Target } from 'lucide-react';
import { format, startOfDay, endOfDay, subDays, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import type { User } from '@/types/users';

interface UsersMetricsProps {
  users: User[];
}

export function UsersMetrics({ users }: UsersMetricsProps) {
  // Basic counts
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive && !u.isLocked).length;
  const lockedUsers = users.filter(u => u.isLocked).length;
  const adminUsers = users.filter(u => u.role === 'ADMIN').length;

  // Role breakdown (actualizado)
  const receptionistUsers = users.filter(u => u.role === 'RECEPTIONIST').length;
  const spaSpecialistUsers = users.filter(u => u.role === 'SPA_SPECIALIST').length;
  const barberUsers = users.filter(u => u.role === 'BARBER').length;
  const beauticianUsers = users.filter(u => u.role === 'BEAUTICIAN').length;
  const managerUsers = users.filter(u => u.role === 'MANAGER').length;

  // Unit breakdown
  const spaUsers = users.filter(u => u.unit === 'SPA').length;
  const barberiaUsers = users.filter(u => u.unit === 'BARBERIA').length;
  const noUnitUsers = users.filter(u => !u.unit).length;

  // Security metrics
  const usersWithFailedAttempts = users.filter(u => u.failedLoginAttempts > 0).length;
  const usersMustChangePassword = users.filter(u => u.mustChangePassword).length;
  const avgFailedAttempts = users.length > 0 
    ? users.reduce((sum, u) => sum + u.failedLoginAttempts, 0) / users.length 
    : 0;

  // Commission metrics
  const usersWithCommission = users.filter(u => u.commissionPct && u.commissionPct > 0).length;
  const avgCommissionRate = usersWithCommission > 0
    ? users.reduce((sum, u) => sum + (u.commissionPct || 0), 0) / usersWithCommission
    : 0;

  // Recent users (created in last 30 days)
  const recentUsers = users.filter(u => {
    const createdDate = new Date(u.createdAt);
    const thirtyDaysAgo = subDays(new Date(), 30);
    return createdDate >= thirtyDaysAgo;
  });

  // Today's new users
  const todayUsers = users.filter(u => {
    const createdDate = new Date(u.createdAt);
    return isToday(createdDate);
  });

  // This week new users
  const weekUsers = users.filter(u => {
    const createdDate = new Date(u.createdAt);
    return isThisWeek(createdDate, { weekStartsOn: 1 });
  });

  // Activity rate
  const activityRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

  // Security risk score
  const securityRiskScore = totalUsers > 0 
    ? ((lockedUsers + usersWithFailedAttempts + usersMustChangePassword) / totalUsers) * 100 
    : 0;

  return (
    <>
      {/* First Row - 4 Core Users Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Users */}
        <div className="relative overflow-hidden rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-50 to-blue-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-blue-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-blue-600 shadow-lg group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-blue-800 bg-white px-3 py-1 rounded-full border border-blue-300 shadow-sm">Total</span>
            </div>
            <p className="text-3xl font-bold text-blue-900 tabular-nums mb-2">{totalUsers}</p>
            <p className="text-sm text-blue-700 font-medium">Usuarios totales</p>
          </div>
        </div>

        {/* Active Users */}
        <div className="relative overflow-hidden rounded-xl border-2 border-green-500/30 bg-gradient-to-br from-green-50 to-green-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-green-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 border-2 border-green-600 shadow-lg group-hover:scale-110 transition-transform">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-green-800 bg-white px-3 py-1 rounded-full border border-green-300 shadow-sm">Activos</span>
            </div>
            <p className="text-3xl font-bold text-green-900 tabular-nums mb-2">{activeUsers}</p>
            <p className="text-sm text-green-700 font-medium">Usuarios activos</p>
          </div>
        </div>

        {/* Locked Users */}
        <div className="relative overflow-hidden rounded-xl border-2 border-red-500/30 bg-gradient-to-br from-red-50 to-red-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-red-100/50 to-red-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 border-2 border-red-600 shadow-lg group-hover:scale-110 transition-transform">
                <UserX className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-red-800 bg-white px-3 py-1 rounded-full border border-red-300 shadow-sm">Bloqueados</span>
            </div>
            <p className="text-3xl font-bold text-red-900 tabular-nums mb-2">{lockedUsers}</p>
            <p className="text-sm text-red-700 font-medium">Usuarios bloqueados</p>
          </div>
        </div>

        {/* Admin Users */}
        <div className="relative overflow-hidden rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-50 to-purple-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-purple-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-purple-600 shadow-lg group-hover:scale-110 transition-transform">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-purple-800 bg-white px-3 py-1 rounded-full border border-purple-300 shadow-sm">Admins</span>
            </div>
            <p className="text-3xl font-bold text-purple-900 tabular-nums mb-2">{adminUsers}</p>
            <p className="text-sm text-purple-700 font-medium">Administradores</p>
          </div>
        </div>
      </div>

      {/* Second Row - 4 Additional Users Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Activity Rate */}
        <div className="relative overflow-hidden rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/50 to-emerald-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 border-2 border-emerald-600 shadow-lg group-hover:scale-110 transition-transform">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-300 shadow-sm">Actividad</span>
            </div>
            <p className="text-3xl font-bold text-emerald-900 tabular-nums mb-2">{activityRate.toFixed(1)}%</p>
            <p className="text-sm text-emerald-700 font-medium">Tasa de actividad</p>
          </div>
        </div>

        {/* Security Risk */}
        <div className="relative overflow-hidden rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-50 to-amber-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-100/50 to-amber-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 border-2 border-amber-600 shadow-lg group-hover:scale-110 transition-transform">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-amber-800 bg-white px-3 py-1 rounded-full border border-amber-300 shadow-sm">Riesgo</span>
            </div>
            <p className="text-3xl font-bold text-amber-900 tabular-nums mb-2">{securityRiskScore.toFixed(1)}%</p>
            <p className="text-sm text-amber-700 font-medium">Nivel de riesgo</p>
          </div>
        </div>

        {/* New Users This Month */}
        <div className="relative overflow-hidden rounded-xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/50 to-indigo-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 border-2 border-indigo-600 shadow-lg group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-indigo-800 bg-white px-3 py-1 rounded-full border border-indigo-300 shadow-sm">Nuevos</span>
            </div>
            <p className="text-3xl font-bold text-indigo-900 tabular-nums mb-2">{recentUsers.length}</p>
            <p className="text-sm text-indigo-700 font-medium">Últimos 30 días</p>
          </div>
        </div>

        {/* Users with Commission */}
        <div className="relative overflow-hidden rounded-xl border-2 border-teal-500/30 bg-gradient-to-br from-teal-50 to-teal-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-100/50 to-teal-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 border-2 border-teal-600 shadow-lg group-hover:scale-110 transition-transform">
                <Award className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-teal-800 bg-white px-3 py-1 rounded-full border border-teal-300 shadow-sm">Comisión</span>
            </div>
            <p className="text-3xl font-bold text-teal-900 tabular-nums mb-2">{usersWithCommission}</p>
            <p className="text-sm text-teal-700 font-medium">Con comisión</p>
          </div>
        </div>
      </div>
    </>
  );
}
