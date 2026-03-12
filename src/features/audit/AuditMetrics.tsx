import { FileText, AlertCircle, User, Activity, Shield, Database, Monitor, Fingerprint, Clock, TrendingUp, Calendar, Eye, Lock, Settings, Trash2, Key, Download, Search, Filter } from 'lucide-react';
import { format, startOfDay, endOfDay, subDays, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AuditLog } from '@/types/audit';
import { isCriticalAction, getActionLabel } from '@/types/audit';

interface AuditMetricsProps {
  data: AuditLog[];
  dateFrom: Date;
  dateTo: Date;
}

export function AuditMetrics({ data, dateFrom, dateTo }: AuditMetricsProps) {
  // Basic counts
  const totalAudits = data.length;
  
  // Critical security actions
  const criticalActions = data.filter(row => 
    isCriticalAction(row.action)
  );

  // Login/Logout activities
  const sessionActivities = data.filter(row => 
    row.action === 'LOGIN' || 
    row.action === 'LOGOUT'
  );

  // Failed login attempts (simulado - debería venir del backend)
  const failedLogins = data.filter(row => 
    row.action.includes('FAILED') || 
    (row.action === 'LOGIN' && row.entity === 'FAILED_ATTEMPT')
  );

  // Business operations (ventas, servicios, clientes)
  const businessOperations = data.filter(row => 
    ['Sale', 'Service', 'Client', 'Appointment'].includes(row.entity) &&
    ['CREATE', 'UPDATE', 'CANCEL'].some(action => row.action.includes(action))
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

  // Suspicious activities (múltiples intentos, horarios inusuales)
  const suspiciousActivities = data.filter(row => {
    const auditHour = new Date(row.createdAt).getHours();
    // Actividades fuera de horario laboral (10pm-6am)
    const isAfterHours = auditHour >= 22 || auditHour <= 6;
    // Acciones críticas fuera de horario
    return isCriticalAction(row.action) && isAfterHours;
  });

  // Peak hours analysis
  const hourlyActivity = data.reduce((acc, row) => {
    const hour = new Date(row.createdAt).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  const peakHour = Object.entries(hourlyActivity).reduce((best, [hour, count]) => 
    count > best.count ? { hour: parseInt(hour), count } : best
  , { hour: 0, count: 0 });

  // Weekend vs Weekday comparison
  const weekendAudits = data.filter(row => {
    const auditDate = new Date(row.createdAt);
    const dayOfWeek = auditDate.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  });

  const weekdayAudits = data.filter(row => {
    const auditDate = new Date(row.createdAt);
    const dayOfWeek = auditDate.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
  });

  // Get action icon
  const getActionIcon = (action: string) => {
    if (action === 'LOGIN' || action === 'LOGOUT') return <User className="h-4 w-4" />;
    if (action.includes('DELETE') || action.includes('CANCEL')) return <Trash2 className="h-4 w-4" />;
    if (action.includes('CREATE')) return <Download className="h-4 w-4" />;
    if (action.includes('UPDATE')) return <Settings className="h-4 w-4" />;
    if (action.includes('RESET') || action.includes('UNLOCK')) return <Key className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
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
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 border-2 border-blue-600 shadow-lg group-hover:scale-110 transition-transform">
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
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-700 border-2 border-red-600 shadow-lg group-hover:scale-110 transition-transform">
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
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-600 to-green-700 border-2 border-green-600 shadow-lg group-hover:scale-110 transition-transform">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-green-800 bg-white px-3 py-1 rounded-full border border-green-300 shadow-sm">Sesiones</span>
            </div>
            <p className="text-3xl font-bold text-green-900 tabular-nums mb-2">{sessionActivities.length}</p>
            <p className="text-sm text-green-700 font-medium">Login/Logout</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="relative overflow-hidden rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-50 to-purple-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-purple-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 border-2 border-purple-600 shadow-lg group-hover:scale-110 transition-transform">
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
        {/* Failed Logins */}
        <div className="relative overflow-hidden rounded-xl border-2 border-red-500/30 bg-gradient-to-br from-red-50 to-red-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-red-100/50 to-red-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-700 border-2 border-red-600 shadow-lg group-hover:scale-110 transition-transform">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-red-800 bg-white px-3 py-1 rounded-full border border-red-300 shadow-sm">Seguridad</span>
            </div>
            <p className="text-3xl font-bold text-red-900 tabular-nums mb-2">{failedLogins.length}</p>
            <p className="text-sm text-red-700 font-medium">Intentos fallidos</p>
          </div>
        </div>

        {/* Business Operations */}
        <div className="relative overflow-hidden rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/50 to-emerald-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 border-2 border-emerald-600 shadow-lg group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-300 shadow-sm">Negocio</span>
            </div>
            <p className="text-3xl font-bold text-emerald-900 tabular-nums mb-2">{businessOperations.length}</p>
            <p className="text-sm text-emerald-700 font-medium">Operaciones</p>
          </div>
        </div>

        {/* Suspicious Activities */}
        <div className="relative overflow-hidden rounded-xl border-2 border-orange-500/30 bg-gradient-to-br from-orange-50 to-orange-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-100/50 to-orange-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 border-2 border-orange-600 shadow-lg group-hover:scale-110 transition-transform">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-orange-800 bg-white px-3 py-1 rounded-full border border-orange-300 shadow-sm">Alerta</span>
            </div>
            <p className="text-3xl font-bold text-orange-900 tabular-nums mb-2">{suspiciousActivities.length}</p>
            <p className="text-sm text-orange-700 font-medium">Sospechosas</p>
          </div>
        </div>

        {/* Peak Hour */}
        <div className="relative overflow-hidden rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-50 to-purple-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-purple-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 border-2 border-purple-600 shadow-lg group-hover:scale-110 transition-transform">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-purple-800 bg-white px-3 py-1 rounded-full border border-purple-300 shadow-sm">Pico</span>
            </div>
            <p className="text-3xl font-bold text-purple-900 tabular-nums mb-2">{peakHour.hour}:00</p>
            <p className="text-sm text-purple-700 font-medium">{peakHour.count} acciones</p>
          </div>
        </div>
      </div>
    </>
  );
}
