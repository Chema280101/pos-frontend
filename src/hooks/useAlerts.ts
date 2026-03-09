'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import type { AppNotification } from '@/store/notificationStore';

interface ServerAlert {
  type: AppNotification['type'];
  title: string;
  message: string;
  link?: string;
  linkLabel?: string;
}

/** Para Admin: hace polling a GET /api/alerts y fusiona las alertas en el store de notificaciones. */
export function useAlerts(enabled: boolean = true): void {
  const user = useAuthStore((s) => s.user);
  const setItems = useNotificationStore((s) => s.setItems);
  const isAdmin = enabled && user?.role === 'ADMIN';

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: async (): Promise<ServerAlert[]> => {
      const { data } = await api.get<ServerAlert[]>('/api/alerts');
      return data;
    },
    enabled: isAdmin,
    refetchInterval: 5 * 60 * 1000, // 5 min
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (!isAdmin) return;

    const mapped: AppNotification[] = alerts.map((a, i) => ({
      id: `alert-${i}-${a.title}`,
      type: a.type,
      title: a.title,
      message: a.message,
      read: false,
      createdAt: new Date().toISOString(),
      link: a.link,
      linkLabel: a.linkLabel,
    }));

    const current = useNotificationStore.getState().items;
    const localOnly = current.filter((i) => !i.id.startsWith('alert-'));
    setItems([...mapped, ...localOnly]);
  }, [isAdmin, alerts, setItems]);
}
