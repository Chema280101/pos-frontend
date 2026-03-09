'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Calendar, Package, Wallet, Percent, Info, AlertTriangle } from 'lucide-react';
import { useNotificationStore, type AppNotification } from '@/store/notificationStore';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const typeIcons: Record<AppNotification['type'], React.ReactNode> = {
  appointment: <Calendar className="h-4 w-4" />,
  stock: <Package className="h-4 w-4" />,
  cash: <Wallet className="h-4 w-4" />,
  commission: <Percent className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
};

const criticalTypes: AppNotification['type'][] = ['stock', 'cash'];

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps): JSX.Element {
  const items = useNotificationStore((s) => s.items);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const grouped = items.reduce<Record<string, AppNotification[]>>((acc, n) => {
    const key = n.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});

  const typeLabels: Record<AppNotification['type'], string> = {
    appointment: 'Citas',
    stock: 'Inventario',
    cash: 'Caja',
    commission: 'Comisiones',
    info: 'General',
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="w-screen max-w-sm rounded-l-[var(--unit-border-radius)] bg-[var(--unit-surface)] shadow-unit">
                  <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--unit-border)' }}>
                      <Dialog.Title className="font-heading text-lg font-semibold text-[var(--unit-text-muted)]">
                        Notificaciones
                        {unreadCount > 0 && (
                          <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                            {unreadCount}
                          </span>
                        )}
                      </Dialog.Title>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={() => markAllAsRead()}
                            className="text-xs text-[var(--unit-accent)] hover:underline"
                          >
                            Marcar todas leídas
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={onClose}
                          className="rounded p-1 !text-[var(--unit-text)] hover:bg-[var(--unit-primary)]"
                          aria-label="Cerrar"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                          <Info className="mb-3 h-10 w-10 !text-[var(--unit-text-muted)]/30" aria-hidden />
                          <p className="text-sm text-[var(--unit-text)]/70">No hay notificaciones</p>
                        </div>
                      ) : (
                        Object.entries(grouped).map(([type, notifications]) => (
                          <div key={type}>
                            <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-[var(--unit-secondary)]/50 px-6 py-2" style={{ borderColor: 'var(--unit-border)' }}>
                              <span className="!text-[var(--unit-text-muted)]">{typeIcons[type as AppNotification['type']]}</span>
                              <span className="text-xs font-semibold uppercase tracking-wide !text-[var(--unit-text-muted)]">
                                {typeLabels[type as AppNotification['type']]}
                              </span>
                            </div>
                            <ul>
                              {notifications.map((n) => {
                                const isCritical = criticalTypes.includes(n.type) && !n.read;
                                return (
                                  <li
                                    key={n.id}
                                    className={cn(
                                      'border-b px-6 py-3 transition',
                                      !n.read && 'bg-[var(--unit-primary)]/10',
                                      isCritical && 'border-l-2 border-l-red-500 bg-red-50/10'
                                    )}
                                    style={{ borderBottomColor: 'var(--unit-border)' }}
                                  >
                                    <div className="flex gap-3">
                                      <span className={cn('mt-0.5 shrink-0', isCritical ? 'text-red-500' : 'text-[var(--unit-text)]/60')}>
                                        {isCritical ? <AlertTriangle className="h-4 w-4" /> : typeIcons[n.type]}
                                      </span>
                                      <div className="min-w-0 flex-1">
                                        <p className={cn('text-sm font-medium', isCritical ? 'text-red-700' : 'text-[var(--unit-text)]')}>
                                          {n.title}
                                        </p>
                                        <p className="mt-0.5 text-xs text-[var(--unit-text)]/70">{n.message}</p>
                                        <div className="mt-1.5 flex items-center gap-3">
                                          {n.link && (
                                            <Link
                                              href={n.link}
                                              className="text-xs font-medium text-[var(--unit-accent)] hover:underline"
                                              onClick={() => {
                                                markAsRead(n.id);
                                                onClose();
                                              }}
                                            >
                                              {n.linkLabel ?? 'Ver'}
                                            </Link>
                                          )}
                                          {!n.read && (
                                            <button
                                              type="button"
                                              onClick={() => markAsRead(n.id)}
                                              className="text-xs text-[var(--unit-text)]/50 hover:underline"
                                            >
                                              Marcar leída
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
