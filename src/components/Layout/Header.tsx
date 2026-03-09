'use client';

import { useState, useRef, useEffect, memo, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Key, LogOut, User, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUnitStore } from '@/store/unitStore';
import { usePrefetchQueries } from '@/hooks/usePrefetchQueries';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useAlerts } from '@/hooks/useAlerts';
import { useAppointmentReminders } from '@/hooks/useAppointmentReminders';
import { ConfirmModal, Drawer } from '@/components/ui';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/Notifications/NotificationBell';

interface HeaderProps {
  onMenuClick?: () => void;
}

// ✅ OPTIMIZACIÓN: Componentes separados para polling - reciben role como prop
const AlertsComponent = memo(({ role }: { role?: string }) => {
  const isActive = !!role && ['ADMIN', 'RECEPTIONIST'].includes(role);
  
  // ✅ Llamar hook siempre con parámetro enabled
  useAlerts(isActive);
  
  return null;
});

AlertsComponent.displayName = 'AlertsComponent';

const RemindersComponent = memo(({ role }: { role?: string }) => {
  const isActive = !!role && ['ADMIN', 'RECEPTIONIST', 'SPA_SPECIALIST', 'BARBER'].includes(role);
  
  // ✅ Llamar hook siempre con parámetro enabled
  useAppointmentReminders(isActive);
  
  return null;
});

RemindersComponent.displayName = 'RemindersComponent';

export function Header({ onMenuClick }: HeaderProps): JSX.Element {
  const router = useRouter();
  // ✅ OPTIMIZACIÓN: Única subscripción a useAuthStore
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const activeUnit = useUnitStore((s) => s.activeUnit);
  const setUnit = useUnitStore((s) => s.setUnit);
  const online = useOnlineStatus();
  const prefetchRoute = usePrefetchQueries();
  const [open, setOpen] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // ✅ OPTIMIZACIÓN: Memoizar initial
  const initial = useMemo(
    () => user?.name?.charAt(0)?.toUpperCase() ?? '?',
    [user?.name]
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setLogoutModal(false);
    router.replace('/login');
  };

  // ✅ OPTIMIZACIÓN: Memoizar handleUnitChange
  const handleUnitChange = useCallback((unit: 'SPA' | 'BARBERIA') => {
    setUnit(unit);
    // Also emit calendar filter event to sync calendar view
    window.dispatchEvent(new CustomEvent('calendarFilterChange', { 
      detail: { unit } 
    }));
  }, [setUnit]);

  return (
    <>
      <AlertsComponent role={user?.role} />
      <RemindersComponent role={user?.role} />
      
    <header
      className="sticky top-0 z-40 border-2 border-[var(--unit-border)]/30 bg-gradient-to-r from-white/95 to-white/85 backdrop-blur-md shadow-2xl px-6 py-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)] p-2 text-[var(--unit-text)] hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10 transition-all lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu className="h-6 w-6" />
            </button>
          )}
          <div className="font-heading text-lg font-semibold tracking-tight text-[var(--unit-text)]">
            {activeUnit === 'SPA' && 'SPA'}
              {activeUnit === 'BARBERIA' && 'BARMAN BARBERIA'}
            {!activeUnit && 'Barbería y Spa POS'}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <span
            title={online ? 'Conectado' : 'Sin conexión'}
            aria-label={online ? 'Conectado' : 'Sin conexión'}
          >
            <span
              className={cn(
                'inline-block h-2.5 w-2.5 shrink-0 rounded-full',
                online ? 'bg-green-500' : 'bg-red-500'
              )}
            />
          </span>
          <NotificationBell />
          {user?.role === 'ADMIN' && (
            <div className="flex rounded-2xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)]/50 p-1 shadow-lg">
              {(['SPA', 'BARBERIA'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => handleUnitChange(u)}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200 ${
                    activeUnit === u
                      ? 'bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white shadow-lg border-2 border-[var(--unit-accent)]/50'
                      : 'text-[var(--unit-text)] hover:bg-[var(--unit-accent)]/10 border-2 border-transparent'
                  }`}
                >
                  {u === 'BARBERIA' ? 'Barbería' : u}
                </button>
              ))}
            </div>
          )}

          <div className="relative" ref={ref}>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-3 rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)]/50 p-3 hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10 transition-all duration-200 group"
              aria-expanded={open}
              aria-haspopup="true"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] text-sm font-bold text-white shadow-lg border-2 border-[var(--unit-accent)]/50 group-hover:scale-105 transition-transform"
                aria-hidden
              >
                {initial}
              </span>
              <span className="hidden text-left text-sm text-[var(--unit-text)] sm:block">
                <span className="font-bold text-[var(--unit-text)]">{user?.name}</span>
                <span className="ml-1 block text-xs text-[var(--unit-text-muted)]">
                  {user?.role} {user?.unit ? ` · ${user.unit}` : ''}
                </span>
              </span>
              <ChevronDown className="h-4 w-4 text-[var(--unit-text-muted)] group-hover:text-[var(--unit-accent)] transition-colors" />
            </button>

            {open && (
              <div
                className="absolute right-0 top-full z-50 mt-3 w-64 rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl py-2"
                role="menu"
              >
                {/* Header del dropdown */}
                <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-4 py-3 border-b border-[var(--unit-border)]/30 -mx-2 -mt-2 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-md">
                      <span className="text-xs font-bold text-white">{initial}</span>
                    </div>
                    <div>
                      <p className="font-bold text-[var(--unit-text)] text-sm">{user?.name}</p>
                      <p className="text-xs text-[var(--unit-text-muted)]">{user?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[var(--unit-text)] hover:bg-[var(--unit-accent)]/10 transition-colors group"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    setProfileDrawerOpen(true);
                  }}
                >
                  <User className="h-4 w-4 text-[var(--unit-text-muted)] group-hover:text-[var(--unit-accent)] transition-colors" />
                  <span className="font-medium">Mi perfil</span>
                </button>
                <Link
                  href="/change-password"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--unit-text)] hover:bg-[var(--unit-accent)]/10 transition-colors group"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  onMouseEnter={() => prefetchRoute('/change-password')}
                  onFocus={() => prefetchRoute('/change-password')}
                >
                  <Key className="h-4 w-4 text-[var(--unit-text-muted)] group-hover:text-[var(--unit-accent)] transition-colors" />
                  <span className="font-medium">Cambiar contraseña</span>
                </Link>
                
                {/* Divider */}
                <div className="border-t border-[var(--unit-border)]/30 my-2"></div>
                
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors group"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    setLogoutModal(true);
                  }}
                >
                  <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Drawer
        open={profileDrawerOpen}
        onClose={() => setProfileDrawerOpen(false)}
        title="Mi perfil"
        width="md"
      >
        <div className="space-y-4 text-sm text-[var(--unit-text-muted)]">
          <div>
            <p className="text-xs font-medium text-[var(--unit-text-muted)]">Nombre</p>
            <p className="mt-0.5">{user?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--unit-text)]/70">Email</p>
            <p className="mt-0.5">{user?.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--unit-text)]/70">Rol</p>
            <p className="mt-0.5">{user?.role ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--unit-text)]/70">Unidad</p>
            <p className="mt-0.5">{user?.unit ?? 'Todas las unidades'}</p>
          </div>
          <Link
            href="/change-password"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] px-4 py-2 text-white font-bold shadow-lg border-2 border-[var(--unit-accent)]/50 hover:shadow-xl hover:scale-[1.02] transition-all"
            onClick={() => setProfileDrawerOpen(false)}
          >
            <Key className="h-4 w-4" />
            Cambiar contraseña
          </Link>
        </div>
      </Drawer>

      <ConfirmModal
        open={logoutModal}
        onClose={() => setLogoutModal(false)}
        onConfirm={handleLogout}
        title="Cerrar sesión"
        description="¿Estás seguro de que deseas cerrar sesión?"
        confirmLabel="Cerrar sesión"
        cancelLabel="Cancelar"
        variant="primary"
      />
    </header>
    </>
  );
}
