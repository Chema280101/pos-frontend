'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useNotificationStore, type AppNotification } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';

export function useNotifications(): {
  items: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
} {
  const user = useAuthStore((s) => s.user);
  const items = useNotificationStore((s) => s.items);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const setItems = useNotificationStore((s) => s.setItems);

  const { data, isLoading } = useQuery<AppNotification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data: res } = await api.get<AppNotification[]>('/api/notifications');
      return res;
    },
    enabled: !!user,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });

  useEffect(() => {
    if (data) {
      setItems(data);
    }
  }, [data, setItems]);

  return { items, unreadCount, isLoading };
}