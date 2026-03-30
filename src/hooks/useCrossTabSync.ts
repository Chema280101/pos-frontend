'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface SyncMessage {
  type: 'invalidate';
  queryKey: string[];
  timestamp: number;
}

export function useCrossTabSync() {
  const queryClient = useQueryClient();
  const [channel, setChannel] = useState<BroadcastChannel | null>(null);

  useEffect(() => {
    // Intentar Broadcast Channel primero (moderno)
    let broadcastChannel: BroadcastChannel | null = null;
    
    try {
      broadcastChannel = new BroadcastChannel('app-sync');
      
      broadcastChannel.onmessage = (event: MessageEvent<SyncMessage>) => {
        handleSyncMessage(event.data);
      };
      
      setChannel(broadcastChannel);
    } catch (error) {
      // Broadcast Channel not supported, falling back to localStorage
    }

    // Fallback a Storage Events
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'app-sync') {
        const message = JSON.parse(event.newValue || '{}') as SyncMessage;
        handleSyncMessage(message);
      }
    };

    const handleSyncMessage = (message: SyncMessage) => {
      // Ignorar mensajes viejos (más de 1 segundo)
      if (Date.now() - message.timestamp > 1000) {
        queryClient.invalidateQueries({ queryKey: message.queryKey });
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      broadcastChannel?.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [queryClient]);

  const invalidateAcrossTabs = useCallback((queryKey: string[]) => {
    // Invalidar localmente primero
    queryClient.invalidateQueries({ queryKey });
    
    const message: SyncMessage = {
      type: 'invalidate',
      queryKey,
      timestamp: Date.now()
    };

    // Intentar Broadcast Channel
    if (channel) {
      channel.postMessage(message);
    } else {
      // Fallback a localStorage
      localStorage.setItem('app-sync', JSON.stringify(message));
      setTimeout(() => localStorage.removeItem('app-sync'), 100);
    }
  }, [queryClient, channel]);

  return { invalidateAcrossTabs };
}
