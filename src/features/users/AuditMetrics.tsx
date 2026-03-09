import { FileText, AlertCircle, User, Activity, Shield, Database, Monitor, Fingerprint, Clock, TrendingUp, Calendar, Eye, Lock, Settings, Trash2, Key, Download, Search, Filter } from 'lucide-react';
import { format, startOfDay, endOfDay, subDays, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { es } from 'date-fns/locale';

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
  // Basic counts
  const totalAudits = data.length;
  
  // Critical actions
  const criticalActions = data.filter(row => 
    row.action === 'DELETE' || 
    row.action === 'RESET_PASSWORD' || 
    row.action === 'UNLOCK' ||
    row.action === 'LOCK_USER' ||
    row.action === 'CHANGE_ROLE'
  );

  // Login/Logout activities
  const sessionActivities = data.filter(row => 
    row.action === 'LOGIN' || 
    row.action === 'LOGOUT'
  );

  // Recent activity (last hour)
  const oneHourAgo = subDays(new Date(), 1/24); // 1 hour ago
  const recentAudits = data.filter(row => 
    new Date(row.createdAt) >= oneHourAgo
  );

  // Today's activity
  const todayAudits = data.filter(row => {
    const auditDate = new Date(row.createdAt);
    return isToday(auditDate);
  });

  // This week activity
  const weekAudits = data.filter(row => {
    const auditDate = new Date(row.createdAt);
    return isThisWeek(auditDate, { weekStartsOn: 1 });
  });

  // Action breakdown
  const actionBreakdown = data.reduce((acc, row) => {
    acc[row.action] = (acc[row.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Entity breakdown
  const entityBreakdown = data.reduce((acc, row) => {
    acc[row.entity] = (acc[row.entity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Device breakdown
  const deviceBreakdown = data.reduce((acc, row) => {
    const device = row.device || 'Unknown';
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // IP address tracking
  const uniqueIPs = new Set(data.map(row => row.ipAddress).filter(Boolean)).size;
  const uniqueUsers = new Set(data.map(row => row.userId)).size;

  // Most active user
  const userActivity = data.reduce((acc, row) => {
    acc[row.userName] = (acc[row.userName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostActiveUser = Object.entries(userActivity).reduce((best, [user, count]) => 
    count > best.count ? { user, count } : best
  , { user: '', count: 0 });

  // Most common action
  const mostCommonAction = Object.entries(actionBreakdown).reduce((best, [action, count]) => 
    count > best.count ? { action, count } : best
  , { action: '', count: 0 });

  // Most accessed entity
  const mostAccessedEntity = Object.entries(entityBreakdown).reduce((best, [entity, count]) => 
    count > best.count ? { entity, count } : best
  , { entity: '', count: 0 });

  // Security events
  const securityEvents = data.filter(row => 
    row.action.includes('LOGIN') ||
    row.action.includes('LOCK') ||
    row.action.includes('UNLOCK') ||
    row.action.includes('RESET_PASSWORD') ||
    row.action.includes('CHANGE_ROLE')
  );

  // Data modification events
  const dataEvents = data.filter(row => 
    row.action === 'CREATE' ||
    row.action === 'UPDATE' ||
    row.action === 'DELETE'
  );

  // Calculate activity rate (audits per hour)
  const timeDiffHours = (dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60);
  const activityRate = timeDiffHours > 0 ? totalAudits / timeDiffHours : 0;

  // Get action icon
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN': return <User className="h-4 w-4" />;
      case 'LOGOUT': return <Lock className="h-4 w-4" />;
      case 'CREATE': return <Database className="h-4 w-4" />;
      case 'UPDATE': return <Settings className="h-4 w-4" />;
      case 'DELETE': return <Trash2 className="h-4 w-4" />;
      case 'RESET_PASSWORD': return <Key className="h-4 w-4" />;
      case 'LOCK_USER': return <Shield className="h-4 w-4" />;
      case 'UNLOCK': return <Eye className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

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
      default: return action;
    }
  };

  return (
    <>
      {/* First Row - 4 Core Audit Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Audits */}
        <div className="relative overflow-hidden rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-50 to-blue-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-blue-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-blue-600 shadow-lg group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-blue-800 bg-white px-3 py-1 rounded-full border border-blue-300 shadow-sm">Total</span>
            </div>
            <p className="text-3xl font-bold text-blue-900 tabular-nums mb-2">{totalAudits.toLocaleString()}</p>
            <p className="text-sm text-blue-700 font-medium">Registros totales</p>
          </div>
        </div>

        {/* Critical Actions */}
        <div className="relative overflow-hidden rounded-xl border-2 border-red-500/30 bg-gradient-to-br from-red-50 to-red-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-red-100/50 to-red-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 border-2 border-red-600 shadow-lg group-hover:scale-110 transition-transform">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-red-800 bg-white px-3 py-1 rounded-full border border-red-300 shadow-sm">Críticas</span>
            </div>
            <p className="text-3xl font-bold text-red-900 tabular-nums mb-2">{criticalActions.length}</p>
            <p className="text-sm text-red-700 font-medium">Acciones críticas</p>
          </div>
        </div>

        {/* Session Activities */}
        <div className="relative overflow-hidden rounded-xl border-2 border-green-500/30 bg-gradient-to-br from-green-50 to-green-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-green-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 border-2 border-green-600 shadow-lg group-hover:scale-110 transition-transform">
                <User className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-green-800 bg-white px-3 py-1 rounded-full border border-green-300 shadow-sm">Sesiones</span>
            </div>
            <p className="text-3xl font-bold text-green-900 tabular-nums mb-2">{sessionActivities.length}</p>
            <p className="text-sm text-green-700 font-medium">Inicios/Cierres</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="relative overflow-hidden rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-50 to-purple-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-purple-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-purple-600 shadow-lg group-hover:scale-110 transition-transform">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-purple-800 bg-white px-3 py-1 rounded-full border border-purple-300 shadow-sm">Recientes</span>
            </div>
            <p className="text-3xl font-bold text-purple-900 tabular-nums mb-2">{recentAudits.length}</p>
            <p className="text-sm text-purple-700 font-medium">Última hora</p>
          </div>
        </div>
      </div>

      {/* Second Row - 4 Additional Audit Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Activity Rate */}
        <div className="relative overflow-hidden rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/50 to-emerald-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 border-2 border-emerald-600 shadow-lg group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-300 shadow-sm">Frecuencia</span>
            </div>
            <p className="text-3xl font-bold text-emerald-900 tabular-nums mb-2">{activityRate.toFixed(1)}</p>
            <p className="text-sm text-emerald-700 font-medium">Registros/hora</p>
          </div>
        </div>

        {/* Unique Users */}
        <div className="relative overflow-hidden rounded-xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/50 to-indigo-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 border-2 border-indigo-600 shadow-lg group-hover:scale-110 transition-transform">
                <Fingerprint className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-indigo-800 bg-white px-3 py-1 rounded-full border border-indigo-300 shadow-sm">Usuarios</span>
            </div>
            <p className="text-3xl font-bold text-indigo-900 tabular-nums mb-2">{uniqueUsers}</p>
            <p className="text-sm text-indigo-700 font-medium">Usuarios únicos</p>
          </div>
        </div>

        {/* Most Common Action */}
        <div className="relative overflow-hidden rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-50 to-amber-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-100/50 to-amber-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 border-2 border-amber-600 shadow-lg group-hover:scale-110 transition-transform">
                {getActionIcon(mostCommonAction.action)}
              </div>
              <span className="text-xs font-bold text-amber-800 bg-white px-3 py-1 rounded-full border border-amber-300 shadow-sm">Top</span>
            </div>
            <p className="text-lg font-bold text-amber-900 tabular-nums mb-1 truncate">
              {getActionName(mostCommonAction.action)}
            </p>
            <p className="text-sm text-amber-700 font-medium">
              {mostCommonAction.count} veces
            </p>
          </div>
        </div>

        {/* Unique IPs */}
        <div className="relative overflow-hidden rounded-xl border-2 border-teal-500/30 bg-gradient-to-br from-teal-50 to-teal-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-100/50 to-teal-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 border-2 border-teal-600 shadow-lg group-hover:scale-110 transition-transform">
                <Monitor className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-teal-800 bg-white px-3 py-1 rounded-full border border-teal-300 shadow-sm">IPs</span>
            </div>
            <p className="text-3xl font-bold text-teal-900 tabular-nums mb-2">{uniqueIPs}</p>
            <p className="text-sm text-teal-700 font-medium">Direcciones IP</p>
          </div>
        </div>
      </div>
    </>
  );
}
