'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Calendar, Package, Wallet, Percent, Info, CheckCircle } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { cn } from '@/lib/utils';
import type { AppNotification } from '@/store/notificationStore';

const typeIcons: Record<AppNotification['type'], React.ReactNode> = {
  appointment: <Calendar className="h-4 w-4" />,
  stock: <Package className="h-4 w-4" />,
  cash: <Wallet className="h-4 w-4" />,
  commission: <Percent className="h-4 w-4" />,
  approval: <CheckCircle className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
};

export function NotificationBell(): JSX.Element {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const items = useNotificationStore((s) => s.items);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-unit border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)]/50 p-3 text-[var(--unit-text)] hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10 transition-all duration-200 group"
        aria-expanded={open}
        aria-label={unreadCount > 0 ? `${unreadCount} notificaciones sin leer` : 'Notificaciones'}
      >
        <Bell className="h-5 w-5 text-[var(--unit-text-muted)] group-hover:text-[var(--unit-accent)] transition-colors" />
        {unreadCount > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-unit border-2 border-white bg-gradient-to-r from-red-500 to-red-600 px-1.5 text-[10px] font-bold text-white shadow-unit animate-pulse"
            aria-hidden
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-3rem)] sm:w-80 rounded-unit-lg border border-[var(--unit-border)]/60 bg-[var(--unit-surface)] shadow-unit-lg overflow-hidden"
          role="menu"
        >
          {/* Header del dropdown */}
          <div className="bg-[var(--unit-surface-elevated)] border-b border-[var(--unit-border)]/30 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="font-heading text-sm font-bold text-[var(--unit-text)]">
                Notificaciones
              </span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  className="text-xs font-semibold text-[var(--unit-accent)] hover:opacity-80 transition-opacity"
                >
                  Marcar todas leídas
                </button>
              )}
            </div>
          </div>
          
          {/* Divider */}
          <div className="border-t border-[var(--unit-border)]/30" />
          
          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-full bg-[var(--unit-surface)]/50 p-3">
                    <Bell className="h-6 w-6 text-[var(--unit-text-muted)]" />
                  </div>
                  <p className="text-sm font-medium text-[var(--unit-text-muted)]">
                    No hay notificaciones
                  </p>
                </div>
              </div>
            ) : (
              <ul className="py-1">
                {items.map((n) => (
                  <li key={n.id} className="border-b border-[var(--unit-border)]/30 last:border-b-0">
                    <div
                      className={cn(
                        'flex gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-[var(--unit-accent)]/5 group',
                        !n.read && 'bg-[var(--unit-accent)]/10 border-l-2 border-[var(--unit-accent)]'
                      )}
                    >
                      <span className={cn(
                        'mt-0.5 transition-colors',
                        !n.read ? 'text-[var(--unit-accent)]' : 'text-[var(--unit-text-muted)] group-hover:text-[var(--unit-accent)]'
                      )}>
                        {typeIcons[n.type]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={cn(
                          'text-sm font-medium transition-colors',
                          !n.read ? 'text-[var(--unit-text)]' : 'text-[var(--unit-text-muted)] group-hover:text-[var(--unit-text)]'
                        )}>{n.title}</p>
                        <p className="mt-0.5 text-xs text-[var(--unit-text-muted)]">{n.message}</p>
                        {n.link && (
                          <Link
                            href={n.link}
                            className="mt-1 inline-block text-xs font-medium text-[var(--unit-accent)] hover:text-[var(--unit-primary)] transition-colors"
                            onClick={() => {
                              markAsRead(n.id);
                              setOpen(false);
                            }}
                          >
                            {n.linkLabel ?? 'Ver'}
                          </Link>
                        )}
                      </div>
                      {!n.read && (
                        <button
                          type="button"
                          onClick={() => markAsRead(n.id)}
                          className="text-xs font-medium text-[var(--unit-accent)] hover:text-[var(--unit-primary)] transition-colors"
                          aria-label="Marcar como leída"
                        >
                          ·
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
