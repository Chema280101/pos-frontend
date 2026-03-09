import { Database, AlertTriangle, Settings, RefreshCw, Clock, TrendingUp, Calendar, Download, Trash2, HardDrive, Shield, Activity, Zap, CheckCircle, XCircle, FileText } from 'lucide-react';
import { format, startOfDay, endOfDay, subDays, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { es } from 'date-fns/locale';

interface BackupFile {
  name: string;
  size: number;
  createdAt: string;
}

interface BackupConfig {
  retentionDays: number;
  backupSchedule: string;
  enabled: boolean;
  compressionEnabled: boolean;
  backupDirectory: string;
}

interface BackupsMetricsProps {
  backupsData: {
    data: BackupFile[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
  config: BackupConfig | null;
}

export function BackupsMetrics({ backupsData, config }: BackupsMetricsProps) {
  const files = backupsData?.data ?? [];
  const totalBackups = backupsData?.total ?? 0;

  // Size calculations
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const avgSize = files.length > 0 ? totalSize / files.length : 0;
  const largestBackup = files.length > 0 ? files.reduce((max, f) => f.size > max.size ? f : max, files[0]) : null;

  // Time-based metrics
  const now = new Date();
  const todayBackups = files.filter(f => isToday(new Date(f.createdAt)));
  const weekBackups = files.filter(f => isThisWeek(new Date(f.createdAt), { weekStartsOn: 1 }));
  const monthBackups = files.filter(f => isThisMonth(new Date(f.createdAt)));

  // Most recent backup
  const mostRecentBackup = files.length > 0 ? files[0] : null;
  const hoursSinceLastBackup = mostRecentBackup 
    ? (now.getTime() - new Date(mostRecentBackup.createdAt).getTime()) / (1000 * 60 * 60)
    : null;

  // Oldest backup
  const oldestBackup = files.length > 0 ? files[files.length - 1] : null;
  const daysSinceOldest = oldestBackup
    ? (now.getTime() - new Date(oldestBackup.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    : null;

  // Backup frequency analysis
  const backupFrequency = daysSinceOldest && daysSinceOldest > 0 
    ? files.length / daysSinceOldest 
    : 0;

  // Storage efficiency (compression)
  const compressionRatio = config?.compressionEnabled ? 0.7 : 1.0; // Simulated
  const estimatedUncompressedSize = totalSize / compressionRatio;

  // Retention analysis
  const expiredBackups = config?.retentionDays 
    ? files.filter(f => {
        const daysOld = (now.getTime() - new Date(f.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return daysOld > config.retentionDays;
      }).length
    : 0;

  // Format size helper
  const formatSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get status color based on backup health
  const getBackupHealthStatus = () => {
    if (!config?.enabled) return { color: 'red', status: 'Inactivo', icon: XCircle };
    if (!mostRecentBackup) return { color: 'amber', status: 'Sin backups', icon: AlertTriangle };
    if (hoursSinceLastBackup && hoursSinceLastBackup > 48) return { color: 'amber', status: 'Atrasado', icon: AlertTriangle };
    if (hoursSinceLastBackup && hoursSinceLastBackup > 24) return { color: 'blue', status: 'Reciente', icon: Clock };
    return { color: 'green', status: 'Saludable', icon: CheckCircle };
  };

  const healthStatus = getBackupHealthStatus();
  const HealthIcon = healthStatus.icon;

  return (
    <>
      {/* First Row - 4 Core Backups Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Backups */}
        <div className="relative overflow-hidden rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-50 to-blue-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-blue-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-blue-600 shadow-lg group-hover:scale-110 transition-transform">
                <Database className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-blue-800 bg-white px-3 py-1 rounded-full border border-blue-300 shadow-sm">Total</span>
            </div>
            <p className="text-3xl font-bold text-blue-900 tabular-nums mb-2">{totalBackups}</p>
            <p className="text-sm text-blue-700 font-medium">Archivos totales</p>
          </div>
        </div>

        {/* Storage Used */}
        <div className="relative overflow-hidden rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-50 to-purple-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-purple-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-purple-600 shadow-lg group-hover:scale-110 transition-transform">
                <HardDrive className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-purple-800 bg-white px-3 py-1 rounded-full border border-purple-300 shadow-sm">Almacenamiento</span>
            </div>
            <p className="text-3xl font-bold text-purple-900 tabular-nums mb-2">{formatSize(totalSize)}</p>
            <p className="text-sm text-purple-700 font-medium">Espacio usado</p>
          </div>
        </div>

        {/* Backup Health */}
        <div className="relative overflow-hidden rounded-xl border-2 border-green-500/30 bg-gradient-to-br from-green-50 to-green-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-green-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 border-2 border-green-600 shadow-lg group-hover:scale-110 transition-transform">
                <HealthIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-green-800 bg-white px-3 py-1 rounded-full border border-green-300 shadow-sm">Salud</span>
            </div>
            <p className="text-3xl font-bold text-green-900 tabular-nums mb-2">{healthStatus.status}</p>
            <p className="text-sm text-green-700 font-medium">Estado del sistema</p>
          </div>
        </div>

        {/* Last Backup */}
        <div className="relative overflow-hidden rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-50 to-amber-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-100/50 to-amber-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 border-2 border-amber-600 shadow-lg group-hover:scale-110 transition-transform">
                <RefreshCw className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-amber-800 bg-white px-3 py-1 rounded-full border border-amber-300 shadow-sm">Último</span>
            </div>
            <p className="text-3xl font-bold text-amber-900 tabular-nums mb-2">
              {mostRecentBackup ? format(new Date(mostRecentBackup.createdAt), 'dd/MM', { locale: es }) : 'N/A'}
            </p>
            <p className="text-sm text-amber-700 font-medium">Fecha último backup</p>
          </div>
        </div>
      </div>

      {/* Second Row - 4 Additional Backups Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Backup Frequency */}
        <div className="relative overflow-hidden rounded-xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/50 to-indigo-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 border-2 border-indigo-600 shadow-lg group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-indigo-800 bg-white px-3 py-1 rounded-full border border-indigo-300 shadow-sm">Frecuencia</span>
            </div>
            <p className="text-3xl font-bold text-indigo-900 tabular-nums mb-2">{backupFrequency.toFixed(2)}</p>
            <p className="text-sm text-indigo-700 font-medium">Backups por día</p>
          </div>
        </div>

        {/* Average Size */}
        <div className="relative overflow-hidden rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/50 to-emerald-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 border-2 border-emerald-600 shadow-lg group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-300 shadow-sm">Promedio</span>
            </div>
            <p className="text-3xl font-bold text-emerald-900 tabular-nums mb-2">{formatSize(avgSize)}</p>
            <p className="text-sm text-emerald-700 font-medium">Tamaño promedio</p>
          </div>
        </div>

        {/* This Month Backups */}
        <div className="relative overflow-hidden rounded-xl border-2 border-teal-500/30 bg-gradient-to-br from-teal-50 to-teal-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-100/50 to-teal-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 border-2 border-teal-600 shadow-lg group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-teal-800 bg-white px-3 py-1 rounded-full border border-teal-300 shadow-sm">Mes</span>
            </div>
            <p className="text-3xl font-bold text-teal-900 tabular-nums mb-2">{monthBackups.length}</p>
            <p className="text-sm text-teal-700 font-medium">Backups este mes</p>
          </div>
        </div>

        {/* Expired Backups */}
        <div className="relative overflow-hidden rounded-xl border-2 border-red-500/30 bg-gradient-to-br from-red-50 to-red-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-red-100/50 to-red-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 border-2 border-red-600 shadow-lg group-hover:scale-110 transition-transform">
                <Trash2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-red-800 bg-white px-3 py-1 rounded-full border border-red-300 shadow-sm">Expirados</span>
            </div>
            <p className="text-3xl font-bold text-red-900 tabular-nums mb-2">{expiredBackups}</p>
            <p className="text-sm text-red-700 font-medium">Para eliminar</p>
          </div>
        </div>
      </div>
    </>
  );
}
