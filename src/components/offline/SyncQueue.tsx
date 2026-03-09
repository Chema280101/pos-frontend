'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Trash2, Cloud, CloudOff } from 'lucide-react';
import { getPendingOperations, removeOperation, type QueuedOperation } from '@/lib/offline';
import { api } from '@/lib/api';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useToastStore } from '@/store/toastStore';
import { cn } from '@/lib/utils';

export function SyncQueue(): JSX.Element | null {
  const [ops, setOps] = useState<QueuedOperation[]>([]);
  const [syncing, setSyncing] = useState(false);
  const isOnline = useOnlineStatus();
  const addToast = useToastStore((s) => s.addToast);

  const loadOps = useCallback(async () => {
    try {
      const pending = await getPendingOperations();
      setOps(pending);
    } catch {
      // IndexedDB might not be available
    }
  }, []);

  useEffect(() => {
    loadOps();
  }, [loadOps]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && ops.length > 0) {
      syncAll();
    }
  }, [isOnline]);

  const syncAll = async (): Promise<void> => {
    if (syncing || ops.length === 0) return;
    setSyncing(true);

    let successCount = 0;
    for (const op of ops) {
      try {
        await api.request({
          method: op.method,
          url: op.url,
          data: op.body,
        });
        await removeOperation(op.id);
        successCount++;
      } catch {
        // Keep failed ops in queue
      }
    }

    await loadOps();
    setSyncing(false);

    if (successCount > 0) {
      addToast(`${successCount} operación(es) sincronizada(s)`, 'success');
    }
  };

  const handleRemove = async (id: string): Promise<void> => {
    await removeOperation(id);
    await loadOps();
  };

  if (ops.length === 0) return null;

  return (
    <div
      className="rounded-[var(--unit-border-radius)] border bg-[var(--unit-surface-elevated)] p-4"
      style={{ borderColor: 'var(--unit-border)', boxShadow: 'var(--unit-shadow)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Cloud className="h-4 w-4 text-green-500" />
          ) : (
            <CloudOff className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm font-medium text-[var(--unit-text)]">
            {ops.length} operación(es) pendiente(s)
          </span>
        </div>
        {isOnline && (
          <button
            type="button"
            onClick={syncAll}
            disabled={syncing}
            className="flex items-center gap-1 rounded-[var(--unit-radius-sm)] px-3 py-1 text-xs font-medium text-[var(--unit-accent)] hover:bg-[var(--unit-primary)]/20 disabled:opacity-50"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', syncing && 'animate-spin')} />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        )}
      </div>

      <AnimatePresence>
        <ul className="mt-3 space-y-1">
          {ops.map((op) => (
            <motion.li
              key={op.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between rounded-[var(--unit-radius-sm)] bg-[var(--unit-primary)]/10 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-[var(--unit-text)]">
                  {op.description}
                </p>
                <p className="text-[10px] text-[var(--unit-text)]/60">
                  {new Date(op.createdAt).toLocaleString('es-CO')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(op.id)}
                className="ml-2 shrink-0 rounded p-1 text-red-500/70 hover:bg-red-100/30 hover:text-red-600"
                aria-label="Eliminar operación"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </motion.li>
          ))}
        </ul>
      </AnimatePresence>
    </div>
  );
}
