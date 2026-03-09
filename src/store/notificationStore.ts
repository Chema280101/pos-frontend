import { create } from 'zustand';

export interface AppNotification {
  id: string;
  type: 'appointment' | 'stock' | 'cash' | 'commission' | 'info';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
  linkLabel?: string;
}

interface NotificationState {
  items: AppNotification[];
  unreadCount: number;
  setItems: (items: AppNotification[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  add: (n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  unreadCount: 0,

  setItems: (items) =>
    set({ items, unreadCount: items.filter((i) => !i.read).length }),

  markAsRead: (id) =>
    set((state) => {
      const items = state.items.map((i) => (i.id === id ? { ...i, read: true } : i));
      return { items, unreadCount: items.filter((i) => !i.read).length };
    }),

  markAllAsRead: () =>
    set((state) => ({
      items: state.items.map((i) => ({ ...i, read: true })),
      unreadCount: 0,
    })),

  add: (n) =>
    set((state) => {
      const item: AppNotification = {
        ...n,
        id: `n-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        read: false,
        createdAt: new Date().toISOString(),
      };
      const items = [item, ...state.items].slice(0, 50);
      return { items, unreadCount: items.filter((i) => !i.read).length };
    }),
}));
