import { Database, HardDrive, RefreshCw, TrendingUp, Calendar, Trash2, CheckCircle, AlertTriangle, XCircle, Clock, FileText } from 'lucide-react';
import { format, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { KPICard } from '@/components/ui/KPICard';

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

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const avgSize = files.length > 0 ? totalSize / files.length : 0;

  const now = new Date();
  const monthBackups = files.filter(f => isThisMonth(new Date(f.createdAt)));

  const mostRecentBackup = files.length > 0 ? files[0] : null;
  const hoursSinceLastBackup = mostRecentBackup 
    ? (now.getTime() - new Date(mostRecentBackup.createdAt).getTime()) / (1000 * 60 * 60)
    : null;

  const oldestBackup = files.length > 0 ? files[files.length - 1] : null;
  const daysSinceOldest = oldestBackup
    ? (now.getTime() - new Date(oldestBackup.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    : null;

  const backupFrequency = daysSinceOldest && daysSinceOldest > 0 
    ? files.length / daysSinceOldest 
    : 0;

  const expiredBackups = config?.retentionDays 
    ? files.filter(f => {
        const daysOld = (now.getTime() - new Date(f.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return daysOld > config.retentionDays;
      }).length
    : 0;

  const formatSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getBackupHealthStatus = (): { color: 'green' | 'amber' | 'blue' | 'red'; status: string } => {
    if (!config?.enabled) return { color: 'red', status: 'Inactivo' };
    if (!mostRecentBackup) return { color: 'amber', status: 'Sin backups' };
    if (hoursSinceLastBackup && hoursSinceLastBackup > 48) return { color: 'amber', status: 'Atrasado' };
    if (hoursSinceLastBackup && hoursSinceLastBackup > 24) return { color: 'blue', status: 'Reciente' };
    return { color: 'green', status: 'Saludable' };
  };

  const healthStatus = getBackupHealthStatus();

  return (
    <div className="space-y-4 mb-6">
      {/* First Row - 4 Core Backups Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Backups"
          value={totalBackups}
          description="Copias almacenadas"
          color="blue"
          icon={<Database className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Espacio Usado"
          value={formatSize(totalSize)}
          description="Almacenamiento ocupado"
          color="purple"
          icon={<HardDrive className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Estado Backup"
          value={healthStatus.status}
          description="Salud del sistema"
          color={healthStatus.color}
          critical={healthStatus.color === 'red'}
          icon={<CheckCircle className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Último Backup"
          value={mostRecentBackup ? format(new Date(mostRecentBackup.createdAt), 'dd/MM HH:mm', { locale: es }) : 'N/A'}
          description="Fecha y hora de ejecución"
          color="amber"
          icon={<RefreshCw className="h-6 w-6 text-white" />}
        />
      </div>

      {/* Second Row - 4 Additional Backups Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Frecuencia Diaria"
          value={backupFrequency.toFixed(2)}
          description="Copias por día"
          color="indigo"
          icon={<TrendingUp className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Tamaño Medio"
          value={formatSize(avgSize)}
          description="Peso promedio por backup"
          color="teal"
          icon={<FileText className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Copias Este Mes"
          value={monthBackups.length}
          description="Backups en últimos 30 días"
          color="green"
          icon={<Calendar className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Para Depurar"
          value={expiredBackups}
          description="Fuera de política de retención"
          color="red"
          critical={expiredBackups > 0}
          icon={<Trash2 className="h-6 w-6 text-white" />}
        />
      </div>
    </div>
  );
}
