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
import { useApprovalNotifications } from '@/hooks/useApprovalNotifications';
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

const ApprovalNotificationsComponent = memo(({ role }: { role?: string }) => {
  const isActive = role === 'ADMIN';
  
  // ✅ Llamar hook siempre con parámetro enabled
  useApprovalNotifications();
  
  return null;
});

ApprovalNotificationsComponent.displayName = 'ApprovalNotificationsComponent';

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
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  
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
      <ApprovalNotificationsComponent role={user?.role} />
      
    <header
      className="sticky top-0 z-40 border-b border-[var(--unit-border)]/40 bg-[var(--unit-surface)] px-6 py-3.5"
    >
      <div className="flex items-center justify-between gap-2 w-full relative">
        <div className={cn("flex items-center gap-2 flex-1 min-w-0 transition-all", isMobileSearchOpen ? "opacity-0 invisible pointer-events-none lg:opacity-100 lg:visible lg:pointer-events-auto" : "opacity-100")}>
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="rounded-unit border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)] p-3 text-[var(--unit-text)] hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10 transition-all lg:hidden active:scale-95 touch-manipulation"
              aria-label="Abrir menú"
            >
              <Menu className="h-7 w-7" />
            </button>
          )}
          <div className="font-heading text-lg sm:text-xl font-semibold tracking-tight text-[var(--unit-text)] truncate">
            {activeUnit === 'SPA' && 'GLOW SPA'}
              {activeUnit === 'BARBERIA' && 'BARMAN BARBERIA'}
            {!activeUnit && 'Barbería y Spa POS'}
          </div>
        </div>

        {/* Barra de búsqueda central estilo Spotlight */}
        <div 
          className={cn(
            "absolute inset-0 z-10 flex items-center bg-[var(--unit-surface)] lg:static lg:flex lg:flex-1 lg:max-w-lg lg:mx-8 transition-all duration-200",
            isMobileSearchOpen ? "opacity-100 visible" : "opacity-0 invisible lg:opacity-100 lg:visible"
          )}
          ref={searchRef}
        >
          <div className="relative w-full flex items-center gap-2">
            <button
              type="button"
              className="lg:hidden p-2 text-[var(--unit-text-muted)] hover:text-[var(--unit-text)] transition-colors"
              onClick={() => {
                setIsMobileSearchOpen(false);
                setShowSearchResults(false);
              }}
              aria-label="Cerrar búsqueda"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="relative w-full group flex-1">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--unit-text-muted)] group-focus-within:text-[var(--unit-accent)] transition-colors" />
            <input
              type="text"
              placeholder="Buscar clientes, productos, citas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearchResults(searchResults.length > 0)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--unit-border)]/50 bg-[var(--unit-surface-elevated)]/50 rounded-full text-sm text-[var(--unit-text)] placeholder-[var(--unit-text-muted)] focus:bg-[var(--unit-surface)] focus:ring-2 focus:ring-[var(--unit-accent)]/30 focus:border-[var(--unit-accent)]/50 outline-none transition-all shadow-sm group-focus-within:shadow-unit-sm"
            />
            
            {/* Dropdown de resultados */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--unit-surface)] border-2 border-[var(--unit-border)]/50 rounded-unit shadow-unit-lg max-h-96 overflow-y-auto z-50">
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
        </div>

        <div className={cn("flex items-center gap-2 sm:gap-4 shrink-0 transition-all", isMobileSearchOpen ? "opacity-0 invisible pointer-events-none lg:opacity-100 lg:visible lg:pointer-events-auto" : "opacity-100")}>
          <button
            type="button"
            className="lg:hidden p-1.5 sm:p-2 rounded-full text-[var(--unit-text)] hover:bg-[var(--unit-surface-elevated)] transition-colors"
            onClick={() => setIsMobileSearchOpen(true)}
            aria-label="Buscar"
          >
            <Search className="h-5 w-5" />
          </button>
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
            <div className="hidden md:flex rounded-unit-lg border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)]/50 p-1 shadow-unit shrink-0">
              {(['SPA', 'BARBERIA'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => handleUnitChange(u)}
                  className={`rounded-unit px-4 py-2 text-sm font-bold transition-all duration-200 ${
                    activeUnit === u
                      ? 'bg-[var(--unit-accent)] text-white shadow-unit'
                      : 'text-[var(--unit-text)] hover:bg-[var(--unit-accent)]/10'
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
              className="flex items-center gap-3 rounded-full border border-[var(--unit-border)]/50 bg-[var(--unit-surface-elevated)]/50 pl-1.5 pr-4 py-1.5 hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10 transition-all duration-200 group shadow-sm hover:shadow-unit-sm"
              aria-expanded={open}
              aria-haspopup="true"
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--unit-accent)] text-xs font-bold text-white shadow-sm group-hover:scale-105 transition-transform"
                aria-hidden
              >
                {initial}
              </span>
              <span className="hidden text-left text-xs sm:block">
                <span className="font-bold text-[var(--unit-text)] block truncate max-w-[120px]">{user?.name}</span>
                <span className="block text-[10px] uppercase tracking-wider text-[var(--unit-text-muted)] truncate max-w-[120px]">
                  {user?.role ? getRoleLabel(user.role) : user?.role} {user?.unit ? `· ${getUnitLabel(user.unit)}` : ''}
                </span>
              </span>
              <ChevronDown className={cn(
                "h-4 w-4 text-[var(--unit-text-muted)] group-hover:text-[var(--unit-accent)] transition-transform",
                open && "rotate-180 text-[var(--unit-accent)]"
              )} />
            </button>

            {open && (
              <div
                className="absolute right-0 top-full z-50 mt-2 w-64 rounded-unit-lg border border-[var(--unit-border)]/60 bg-[var(--unit-surface)] shadow-unit-lg py-1 animate-in fade-in zoom-in-95 duration-200"
                role="menu"
              >
                {/* Header del dropdown */}
                <div className="px-4 py-3 border-b border-[var(--unit-border)]/40 mb-1">
                  <p className="font-bold text-[var(--unit-text)] text-sm truncate">{user?.name}</p>
                  <p className="text-[11px] text-[var(--unit-text-muted)] truncate">{user?.email}</p>
                </div>

                {/* Menu items */}
                {user?.role === 'ADMIN' && (
                  <div className="px-3 py-2 md:hidden">
                    <p className="text-[10px] font-bold text-[var(--unit-text-muted)] uppercase tracking-wider mb-2">Cambiar Unidad</p>
                    <div className="flex rounded-unit-md border border-[var(--unit-border)]/50 bg-[var(--unit-surface)]/50 p-1 shadow-sm w-full">
                      {(['SPA', 'BARBERIA'] as const).map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => {
                            handleUnitChange(u);
                            setOpen(false);
                          }}
                          className={`flex-1 rounded-sm px-2 py-1.5 text-xs font-bold transition-all duration-200 ${
                            activeUnit === u
                              ? 'bg-[var(--unit-accent)] text-white shadow-unit-sm'
                              : 'text-[var(--unit-text)] hover:bg-[var(--unit-accent)]/10'
                          }`}
                        >
                          {u === 'BARBERIA' ? 'Barbería' : u}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {user?.role === 'ADMIN' && <div className="border-t border-[var(--unit-border)]/40 my-1 md:hidden"></div>}

                <div className="px-1 space-y-0.5">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-left text-xs font-semibold text-[var(--unit-text)] hover:bg-[var(--unit-accent)]/10 hover:text-[var(--unit-accent)] transition-colors group"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      setProfileDrawerOpen(true);
                    }}
                  >
                    <User className="h-4 w-4 text-[var(--unit-text-muted)] group-hover:text-[var(--unit-accent)] transition-colors" />
                    <span>Mi perfil</span>
                  </button>
                  <Link
                    href="/change-password"
                    className="flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold text-[var(--unit-text)] hover:bg-[var(--unit-accent)]/10 hover:text-[var(--unit-accent)] transition-colors group"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    onMouseEnter={() => prefetchRoute('/change-password')}
                    onFocus={() => prefetchRoute('/change-password')}
                  >
                    <Key className="h-4 w-4 text-[var(--unit-text-muted)] group-hover:text-[var(--unit-accent)] transition-colors" />
                    <span>Cambiar contraseña</span>
                  </Link>
                </div>
                
                {/* Divider */}
                <div className="border-t border-[var(--unit-border)]/40 my-1"></div>
                
                <div className="px-1">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-left text-xs font-bold text-rose-600 hover:bg-rose-500/10 transition-colors group"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      setLogoutModal(true);
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
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
            className="inline-flex items-center gap-2 rounded-unit bg-[var(--unit-accent)] px-4 py-2 text-white font-bold shadow-unit hover:shadow-xl hover:scale-[1.02] transition-all"
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
