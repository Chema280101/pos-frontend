'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Button, Skeleton, DataTable, TableToolbar, TableBadge } from '@/components/ui';
import { useToastStore } from '@/store/toastStore';
import { BackupsMetrics } from './BackupsMetrics';
import { Database, Play, RefreshCw, Download, Trash2, AlertTriangle, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackupFile {
  name: string;
  size: number;
  createdAt: string;
}

interface BackupListResult {
  data: BackupFile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface BackupConfig {
  retentionDays: number;
  backupSchedule: string;
  enabled: boolean;
  compressionEnabled: boolean;
  backupDirectory: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function BackupsPage(): JSX.Element {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [page, setPage] = useState(1);
  const [showConfig, setShowConfig] = useState(false);
  const limit = 20;

  const { data: backupsData, isLoading } = useQuery({
    queryKey: ['backups', page, limit],
    queryFn: async (): Promise<BackupListResult> => {
      const { data } = await api.get<BackupListResult>(`/api/backups?page=${page}&limit=${limit}`);
      return data;
    },
  });

  // ✅ NUEVO: Query para configuración
  const { data: config } = useQuery({
    queryKey: ['backup-config'],
    queryFn: async (): Promise<BackupConfig> => {
      const { data } = await api.get<BackupConfig>('/api/backups/config');
      return data;
    },
  });

  const runMutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/backups/run');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      addToast('Backup generado correctamente', 'success');
    },
    onError: (error: any) => {
      addToast(error.response?.data?.error ?? 'Error al ejecutar el backup', 'error');
    },
  });

  // ✅ NUEVO: Mutación para eliminar backup
  const deleteMutation = useMutation({
    mutationFn: async (filename: string) => {
      await api.delete(`/api/backups/${filename}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      addToast('Backup eliminado correctamente', 'success');
    },
    onError: (error: any) => {
      addToast(error.response?.data?.error ?? 'Error al eliminar el backup', 'error');
    },
  });

  // ✅ NUEVO: Mutación para actualizar configuración
  const updateConfigMutation = useMutation({
    mutationFn: async (config: Partial<BackupConfig>) => {
      await api.put('/api/backups/config', config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backup-config'] });
      addToast('Configuración actualizada correctamente', 'success');
    },
    onError: (error: any) => {
      addToast(error.response?.data?.error ?? 'Error al actualizar configuración', 'error');
    },
  });

  // ✅ NUEVO: Función para descargar backup
  const handleDownload = (filename: string) => {
    window.open(`/api/backups/download/${filename}`, '_blank');
  };

  // ✅ NUEVO: Función para eliminar backup
  const handleDelete = (filename: string) => {
    if (confirm(`¿Estás seguro de que quieres eliminar el backup "${filename}"? Esta acción no se puede deshacer.`)) {
      deleteMutation.mutate(filename);
    }
  };

  const handleConfigUpdate = (field: keyof BackupConfig, value: any) => {
    updateConfigMutation.mutate({ [field]: value });
  };

  const files = backupsData?.data ?? [];
  const totalPages = backupsData?.totalPages ?? 1;

  return (
    <div className="min-h-screen bg-[var(--unit-surface)]">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Top Header & Fast Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--unit-border)]/40 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] text-xs font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--unit-accent)] animate-pulse" />
                Respaldo & Continuidad Operativa
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--unit-text)] tracking-tight">
              Copias de Seguridad & Backups
            </h1>
            <p className="text-xs sm:text-sm text-[var(--unit-text-muted)]">
              Generación de respaldos de base de datos, política de retención y restauración de datos
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['backups'] })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-xs font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-all shadow-unit-sm"
              title="Actualizar datos"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin text-[var(--unit-accent)]")} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-xs font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-all shadow-unit-sm"
            >
              <Settings className="h-4 w-4 text-[var(--unit-accent)]" />
              <span>{showConfig ? 'Ocultar Config' : 'Configuración'}</span>
            </button>

            <button
              type="button"
              onClick={() => runMutation.mutate()}
              disabled={runMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-unit bg-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/90 text-white text-xs font-bold transition-all shadow-unit active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {runMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Generando...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Ejecutar Backup</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Backups Metrics */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--unit-accent)] border-t-transparent"></div>
            <span className="ml-2 text-[var(--unit-text)]">Cargando métricas...</span>
          </div>
        ) : (
          <BackupsMetrics backupsData={backupsData || null} config={config || null} />
        )}

        {/* Enhanced Configuration Panel */}
        {showConfig && config && (
          <div className="relative overflow-hidden rounded-unit-lg border border-[var(--unit-border)]/60 bg-[var(--unit-surface-elevated)] shadow-unit p-6">
            {/* Config Header */}
            <div className="bg-[var(--unit-surface-elevated)] px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-unit bg-[var(--unit-accent)] text-white shadow-unit">
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Configuración de Backups</h3>
                  <p className="text-sm text-[var(--unit-text-muted)]">Ajusta los parámetros del sistema</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Días de Retención</label>
                <select
                  value={config.retentionDays}
                  onChange={(e) => handleConfigUpdate('retentionDays', Number(e.target.value))}
                  disabled={updateConfigMutation.isPending}
                  className="w-full rounded-unit border border-[var(--unit-border)]/60 bg-[var(--unit-surface-elevated)] px-4 py-2.5 text-sm text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 cursor-pointer"
                >
                  <option value={7}>7 días</option>
                  <option value={14}>14 días</option>
                  <option value={30}>30 días</option>
                  <option value={60}>60 días</option>
                  <option value={90}>90 días</option>
                  <option value={180}>180 días</option>
                  <option value={365}>365 días</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Programación</label>
                <input
                  type="text"
                  value={config.backupSchedule}
                  disabled
                  className="w-full rounded-unit border border-[var(--unit-border)]/60 bg-[var(--unit-surface-elevated)] opacity-70 px-4 py-2.5 text-sm text-[var(--unit-text-muted)]"
                  title="La programación se configura en el servidor"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider block mb-2">Estado</label>
                <TableBadge type={config.enabled ? 'status-active' : 'status-inactive'}>
                  {config.enabled ? 'Activo' : 'Inactivo'}
                </TableBadge>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider block mb-2">Compresión</label>
                <TableBadge type={config.compressionEnabled ? 'unit-spa' : 'status-neutral'}>
                  {config.compressionEnabled ? 'Habilitada' : 'Deshabilitada'}
                </TableBadge>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Backups Table with DataTable */}
        <div className="relative">
          <DataTable
            columns={[
              {
                key: 'name',
                header: 'Archivo de Respaldo',
                sortable: true,
                align: 'left',
                render: (row: BackupFile) => (
                  <TableBadge type="id" mono>
                    {row.name}
                  </TableBadge>
                ),
              },
              {
                key: 'size',
                header: 'Tamaño',
                sortable: true,
                align: 'right',
                render: (row: BackupFile) => (
                  <TableBadge type="amount" mono>
                    {formatSize(row.size)}
                  </TableBadge>
                ),
              },
              {
                key: 'createdAt',
                header: 'Fecha de Creación',
                sortable: true,
                align: 'left',
                render: (row: BackupFile) => {
                  const d = new Date(row.createdAt);
                  return (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-[var(--unit-text)]">
                        {d.toLocaleDateString('es-PE')}
                      </span>
                      <span className="text-[11px] font-mono text-[var(--unit-text-muted)]">
                        {d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                },
              },
            ]}
            data={files}
            keyExtractor={(row) => row.name}
            loading={isLoading}
            actions={[
              {
                label: 'Descargar',
                variant: 'download',
                icon: <Download className="h-3.5 w-3.5" />,
                onClick: (row: BackupFile) => handleDownload(row.name),
              },
              {
                label: 'Eliminar',
                variant: 'delete',
                icon: <Trash2 className="h-3.5 w-3.5" />,
                onClick: (row: BackupFile) => handleDelete(row.name),
                disabled: () => deleteMutation.isPending,
              },
            ]}
            emptyMessage="No hay backups registrados aún. Ejecuta uno manualmente o espera al programado."
            disableInternalPagination={true}
            pagination={{
              page,
              limit,
              total: backupsData?.total ?? 0,
              totalPages,
              hasNext: page < totalPages,
              hasPrev: page > 1,
            }}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </div>
      </div>
    </div>
  );
}
