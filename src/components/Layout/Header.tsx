'use client';

import { useState, useRef, useEffect, memo, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Users, ChevronDown, LogOut, Settings, Menu, X, User, Key } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUnitStore } from '@/store/unitStore';
import { usePrefetchQueries } from '@/hooks/usePrefetchQueries';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useAlerts } from '@/hooks/useAlerts';
import { useAppointmentReminders } from '@/hooks/useAppointmentReminders';
import { ConfirmModal, Drawer, ThemeToggle } from '@/components/ui';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/Notifications/NotificationBell';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getRoleLabel, getUnitLabel } from '@/lib/translations';

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
  
  // Estados
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [open, setOpen] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  
  // Refs
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Hooks
  const online = useOnlineStatus();
  const prefetchRoute = usePrefetchQueries();
  
  // ✅ OPTIMIZACIÓN: Memoizar logo para evitar re-calculos
  const logoConfig = useMemo(() => ({
    src: activeUnit === 'BARBERIA' ? '/logo-barberia.png' : '/logo-spa.png',
    alt: activeUnit === 'BARBERIA' ? 'Barbería' : 'SPA',
  }), [activeUnit]);

  // Query para búsqueda optimizada - Solo clientes
  const { data: clients } = useQuery({
    queryKey: ['clients-search', activeUnit],
    queryFn: async () => {
      if (!activeUnit) return [];
      const { data } = await api.get(`/api/clients?unit=${activeUnit}&limit=100`);
      return data?.data || [];
    },
    enabled: searchQuery.length > 2 && !!activeUnit,
  });

  // Lógica de búsqueda optimizada - Solo clientes
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (query.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const results: any[] = [];
    
    // Buscar solo en clientes
    if (clients && Array.isArray(clients)) {
      clients.forEach((client: any) => {
        const clientName = typeof client.name === 'string' ? client.name : '';
        const clientDni = typeof client.dni === 'string' ? client.dni : '';
        const clientPhone = typeof client.phone === 'string' ? client.phone : '';
        
        if (
          clientName.toLowerCase().includes(query.toLowerCase()) ||
          clientDni.includes(query) ||
          clientPhone.includes(query)
        ) {
          results.push({
            type: 'client',
            icon: <Users className="h-4 w-4" />,
            title: clientName,
            subtitle: `DNI: ${clientDni} | Tel: ${clientPhone}`,
            href: `/clients/${client.id}`
          });
        }
      });
    }
    
    setSearchResults(results.slice(0, 8)); // Limitar a 8 resultados
    setShowSearchResults(results.length > 0);
  }, [clients]);

  // Actualizar búsqueda cuando cambia el query
  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, handleSearch]);

  // ✅ OPTIMIZACIÓN: Memoizar initial
  const initial = useMemo(
    () => user?.name?.charAt(0)?.toUpperCase() ?? '?',
    [user?.name]
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    }
    if (open || showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open, showSearchResults]);

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
        <div className="flex items-center gap-2 lg:ml-56">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)] p-3 text-[var(--unit-text)] hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10 transition-all lg:hidden active:scale-95 touch-manipulation"
              aria-label="Abrir menú"
            >
              <Menu className="h-7 w-7" />
            </button>
          )}
          <div className="font-heading text-lg font-semibold tracking-tight text-[var(--unit-text)]">
            {activeUnit === 'SPA' && 'GLOW SPA'}
              {activeUnit === 'BARBERIA' && 'BARMAN BARBERIA'}
            {!activeUnit && 'Barbería y Spa POS'}
          </div>
        </div>

        {/* Barra de búsqueda central */}
        <div className="hidden lg:flex flex-1 max-w-md mx-8" ref={searchRef}>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--unit-text-muted)]" />
            <input
              type="text"
              placeholder="Buscar clientes, productos, citas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearchResults(searchResults.length > 0)}
              className="w-full pl-10 pr-4 py-2 border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)]/50 rounded-xl text-sm text-[var(--unit-text)] placeholder-[var(--unit-text-muted)] focus:border-[var(--unit-accent)]/50 focus:bg-[var(--unit-accent)]/10 focus:outline-none transition-all"
            />
            
            {/* Dropdown de resultados */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[var(--unit-border)]/50 rounded-xl shadow-2xl max-h-96 overflow-y-auto z-50">
                <div className="p-2">
                  {searchResults.map((result, index) => (
                    <Link
                      key={index}
                      href={result.href}
                      className="flex items-center gap-3 p-3 hover:bg-[var(--unit-surface)]/50 rounded-lg transition-colors group"
                      onClick={() => {
                        setShowSearchResults(false);
                        setSearchQuery('');
                      }}
                    >
                      <div className="flex-shrink-0 text-[var(--unit-accent)] group-hover:scale-110 transition-transform">
                        {result.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[var(--unit-text)] truncate">
                          {result.title}
                        </div>
                        <div className="text-sm text-[var(--unit-text-muted)] truncate">
                          {result.subtitle}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                {searchResults.length === 0 && searchQuery.length >= 3 && (
                  <div className="p-4 text-center text-[var(--unit-text-muted)]">
                    No se encontraron resultados para "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
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
                  {user?.role ? getRoleLabel(user.role) : user?.role} {user?.unit ? `· ${getUnitLabel(user.unit)}` : ''}
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
            <p className="mt-0.5">{user?.role ? getRoleLabel(user.role) : '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--unit-text)]/70">Unidad</p>
            <p className="mt-0.5">{user?.unit ? getUnitLabel(user.unit) : 'Todas las unidades'}</p>
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
