'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Button, Skeleton } from '@/components/ui';
import { BackupsMetrics } from './BackupsMetrics';
import { Database, Play, RefreshCw, Download, Trash2, AlertTriangle, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

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
    },
  });

  // ✅ NUEVO: Mutación para eliminar backup
  const deleteMutation = useMutation({
    mutationFn: async (filename: string) => {
      await api.delete(`/api/backups/${filename}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
  });

  // ✅ NUEVO: Mutación para actualizar configuración
  const updateConfigMutation = useMutation({
    mutationFn: async (config: Partial<BackupConfig>) => {
      await api.put('/api/backups/config', config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backup-config'] });
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

  // ✅ NUEVO: Función para actualizar configuración
  const handleConfigUpdate = (field: keyof BackupConfig, value: any) => {
    updateConfigMutation.mutate({ [field]: value });
  };

  const files = backupsData?.data ?? [];
  const totalPages = backupsData?.totalPages ?? 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--unit-surface)] via-[var(--unit-surface-elevated)] to-[var(--unit-surface)]">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-4">
              <div className="h-2 w-2 rounded-full bg-[var(--unit-accent)] animate-pulse"></div>
              <span className="text-sm font-medium text-[var(--unit-text)]">
                Sistema de Backups
              </span>
            </div>
            <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">Backups</h1>
            <p className="text-[var(--unit-text-muted)]">
              Copias de seguridad automáticas y manuales del sistema
            </p>
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

          {/* Enhanced Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => runMutation.mutate()}
              disabled={runMutation.isPending}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold shadow-lg border-2 border-green-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {runMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                  Ejecutando...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  Ejecutar Backup
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-lg border-2 border-blue-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <Settings className="h-5 w-5" />
              {showConfig ? 'Ocultar' : 'Configuración'}
            </button>
          </div>
        </div>

        {/* Enhanced Configuration Panel */}
        {showConfig && config && (
          <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6 mb-8">
            {/* Config Header */}
            <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <Settings className="h-5 w-5 text-white" />
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
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 bg-white/90 px-4 py-3 text-sm text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 backdrop-blur-sm"
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
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 bg-gray-100/90 px-4 py-3 text-sm text-[var(--unit-text-muted)] backdrop-blur-sm"
                  title="La programación se configura en el servidor"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Estado</label>
                <div className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300">
                  <div className={`h-2 w-2 rounded-full mr-2 ${config.enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  {config.enabled ? 'Activo' : 'Inactivo'}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Compresión</label>
                <div className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300">
                  <div className={`h-2 w-2 rounded-full mr-2 ${config.compressionEnabled ? 'bg-blue-500' : 'bg-gray-500'}`}></div>
                  {config.compressionEnabled ? 'Habilitada' : 'Deshabilitada'}
                </div>
              </div>
            </div>

            {updateConfigMutation.isError && (
              <div className="mt-4 rounded-xl border-2 border-red-500/30 bg-gradient-to-br from-red-50 to-red-100 p-4">
                <p className="text-sm text-red-800 font-medium">
                  {(updateConfigMutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al actualizar configuración'}
                </p>
              </div>
            )}
            {updateConfigMutation.isSuccess && (
              <div className="mt-4 rounded-xl border-2 border-green-500/30 bg-gradient-to-br from-green-50 to-green-100 p-4">
                <p className="text-sm text-green-800 font-medium">Configuración actualizada correctamente.</p>
              </div>
            )}
          </div>
        )}

        {/* Status Messages */}
        {runMutation.isError && (
          <div className="rounded-xl border-2 border-red-500/30 bg-gradient-to-br from-red-50 to-red-100 p-4 mb-6">
            <p className="text-sm text-red-800 font-medium">
              {(runMutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al ejecutar el backup'}
            </p>
          </div>
        )}
        {runMutation.isSuccess && (
          <div className="rounded-xl border-2 border-green-500/30 bg-gradient-to-br from-green-50 to-green-100 p-4 mb-6">
            <p className="text-sm text-green-800 font-medium">Backup generado correctamente.</p>
          </div>
        )}
        {deleteMutation.isError && (
          <div className="rounded-xl border-2 border-red-500/30 bg-gradient-to-br from-red-50 to-red-100 p-4 mb-6">
            <p className="text-sm text-red-800 font-medium">
              {(deleteMutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al eliminar el backup'}
            </p>
          </div>
        )}
        {deleteMutation.isSuccess && (
          <div className="rounded-xl border-2 border-green-500/30 bg-gradient-to-br from-green-50 to-green-100 p-4 mb-6">
            <p className="text-sm text-green-800 font-medium">Backup eliminado correctamente.</p>
          </div>
        )}

        {/* Enhanced Backups Table */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6">
          {/* Table Header */}
          <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Archivos de Backup</h3>
                  <p className="text-sm text-[var(--unit-text-muted)]">
                    {backupsData?.total ?? 0} archivos disponibles
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-[var(--unit-accent)]/10 px-3 py-1 text-xs font-medium text-[var(--unit-accent)] border border-[var(--unit-accent)]/30">
                Página {page} de {totalPages}
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gradient-to-br from-white/90 to-white/70 rounded-xl border-2 border-[var(--unit-border)]/50 backdrop-blur-sm animate-pulse"></div>
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-12 w-12 text-[var(--unit-text-muted)] mx-auto mb-4" />
              <p className="text-sm text-[var(--unit-text-muted)]">No hay backups aún. Ejecuta uno manualmente o espera al programado (2:00 AM).</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--unit-border)]/30">
                      <th className="px-4 py-3 text-left text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Archivo</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Tamaño</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Fecha</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((f, index) => (
                      <tr key={f.name} className="border-b border-[var(--unit-border)]/20 hover:bg-[var(--unit-surface)]/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-[var(--unit-accent)]"></div>
                            <span className="font-mono text-xs text-[var(--unit-text)]">{f.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--unit-text)]">{formatSize(f.size)}</td>
                        <td className="px-4 py-3 text-sm text-[var(--unit-text-muted)]">{new Date(f.createdAt).toLocaleString('es')}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleDownload(f.name)}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold shadow-lg border-2 border-blue-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                            >
                              <Download className="h-3 w-3" />
                              Descargar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(f.name)}
                              disabled={deleteMutation.isPending}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold shadow-lg border-2 border-red-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deleteMutation.isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Enhanced Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[var(--unit-border)]/30 px-6 py-4 -mx-6 -mb-6 mt-6">
                  <div className="text-sm text-[var(--unit-text-muted)]">
                    Página {page} de {totalPages} ({backupsData?.total ?? 0} archivos)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs font-bold shadow-lg border-2 border-gray-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-3 w-3" />
                      Anterior
                    </button>
                    <span className="text-sm text-[var(--unit-text)] font-medium px-3 py-2 rounded-xl bg-[var(--unit-surface)] border border-[var(--unit-border)]">
                      {page} / {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs font-bold shadow-lg border-2 border-gray-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
