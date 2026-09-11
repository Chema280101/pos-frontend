'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, memo, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ShoppingCart,
  Wallet,
  Package,
  Scissors,
  Percent,
  FileText,
  ShieldCheck,
  History,
  Database,
  Receipt,
  BarChart3,
  X,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Settings,
  Bell,
  DollarSign,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUnitStore } from '@/store/unitStore';
import { usePrefetchQueries } from '@/hooks/usePrefetchQueries';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/auth';

interface SidebarProps {
  /** En móvil: si true, se muestra como overlay */
  mobileOpen?: boolean;
  /** En móvil: cerrar al hacer clic fuera o en un enlace */
  onMobileClose?: () => void;
}

interface NavItem {
  href?: string;
  label: string;
  icon: React.ReactNode;
  roles: UserRole[];
  children?: NavItem[];
}

interface SubmenuState {
  [key: string]: boolean;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Panel Principal', icon: <LayoutDashboard className="h-5 w-5" />, roles: ['ADMIN'] },
  { href: '/clients', label: 'Clientes', icon: <Users className="h-5 w-5" />, roles: ['ADMIN', 'RECEPTIONIST'] },
  { href: '/appointments', label: 'Agenda', icon: <Calendar className="h-5 w-5" />, roles: ['ADMIN', 'RECEPTIONIST', 'SPA_SPECIALIST', 'BARBER'] },
  { href: '/pos', label: 'POS', icon: <ShoppingCart className="h-5 w-5" />, roles: ['ADMIN', 'RECEPTIONIST'] },
  { 
    label: 'Caja', 
    icon: <Wallet className="h-5 w-5" />, 
    roles: ['ADMIN', 'RECEPTIONIST'],
    children: [
      { href: '/cash-register', label: 'Apertura/Cierre', icon: <Wallet className="h-4 w-4" />, roles: ['ADMIN', 'RECEPTIONIST'] },
      { href: '/expenses', label: 'Gastos', icon: <Receipt className="h-4 w-4" />, roles: ['ADMIN', 'RECEPTIONIST'] },
      { href: '/income', label: 'Ingresos', icon: <TrendingUp className="h-4 w-4" />, roles: ['ADMIN', 'RECEPTIONIST'] },
    ]
  },
  { 
    label: 'Inventario', 
    icon: <Package className="h-5 w-5" />, 
    roles: ['ADMIN', 'RECEPTIONIST'],
    children: [
      { href: '/inventory', label: 'Productos', icon: <Package className="h-4 w-4" />, roles: ['ADMIN', 'RECEPTIONIST'] },
      { href: '/suppliers', label: 'Proveedores', icon: <Users className="h-4 w-4" />, roles: ['ADMIN'] },
    ]
  },
  { 
    label: 'Servicios', 
    icon: <Scissors className="h-5 w-5" />, 
    roles: ['ADMIN', 'RECEPTIONIST'],
    children: [
      { href: '/services', label: 'Servicios', icon: <Scissors className="h-4 w-4" />, roles: ['ADMIN', 'RECEPTIONIST'] },
      { href: '/packages', label: 'Paquetes', icon: <Package className="h-4 w-4" />, roles: ['ADMIN', 'RECEPTIONIST'] },
    ]
  },
  { 
    label: 'Comisiones', 
    icon: <Percent className="h-5 w-5" />, 
    roles: ['ADMIN', 'RECEPTIONIST', 'SPA_SPECIALIST', 'BARBER'],
    children: [
      { href: '/commissions/admin', label: 'Liquidar Comisiones', icon: <DollarSign className="h-4 w-4" />, roles: ['ADMIN', 'RECEPTIONIST'] },
      { href: '/commissions', label: 'Mis Comisiones', icon: <Percent className="h-4 w-4" />, roles: ['ADMIN', 'RECEPTIONIST', 'SPA_SPECIALIST', 'BARBER'] },
    ]
  },
  { 
    label: 'Reportes', 
    icon: <FileText className="h-5 w-5" />, 
    roles: ['ADMIN'],
    children: [
      { href: '/reports', label: 'Reportes Generales', icon: <BarChart3 className="h-4 w-4" />, roles: ['ADMIN'] },
      { href: '/reports/detailed', label: 'Reportes Particulares', icon: <FileText className="h-4 w-4" />, roles: ['ADMIN'] },
    ]
  },
  { 
    label: 'Administración', 
    icon: <Settings className="h-5 w-5" />, 
    roles: ['ADMIN'],
    children: [
      { href: '/admin/users', label: 'Usuarios', icon: <ShieldCheck className="h-4 w-4" />, roles: ['ADMIN'] },
      { href: '/approvals', label: 'Aprobaciones', icon: <Bell className="h-4 w-4" />, roles: ['ADMIN'] },
      { href: '/admin/audit', label: 'Auditoría', icon: <History className="h-4 w-4" />, roles: ['ADMIN'] },
      { href: '/admin/backups', label: 'Backups', icon: <Database className="h-4 w-4" />, roles: ['ADMIN'] },
    ]
  },
];

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps): JSX.Element {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const activeUnit = useUnitStore((s) => s.activeUnit);
  const role = user?.role ?? 'BARBER';
  const [openSubmenus, setOpenSubmenus] = useState<SubmenuState>({});
  const prefetchRoute = usePrefetchQueries();

  // ✅ OPTIMIZACIÓN: Memoizar items visibles para evitar re-calculos
  const visible = useMemo(() => 
    navItems.filter((item) => item.roles.includes(role)), 
    [role]
  );

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus((prev: SubmenuState) => {
      const isCurrentlyOpen = prev[label];
      // Si el submenu actual está abierto, cerrarlo
      if (isCurrentlyOpen) {
        return {
          ...prev,
          [label]: false
        };
      }
      // Si está cerrado, cerrar todos los demás y abrir este
      const newState: SubmenuState = {};
      // Cerrar todos los submenús existentes
      Object.keys(prev).forEach(key => {
        newState[key] = false;
      });
      // Abrir el submenu actual
      newState[label] = true;
      return newState;
    });
  };

  const isItemActive = (href: string) => {
    if (href === '/reports') {
      return pathname === '/reports' || pathname === '/reports/overview';
    }
    // Lógica mejorada: coincidencia exacta o para rutas anidadas específicas
    if (pathname === href) {
      return true;
    }
    // Para rutas anidadas, verificar que el pathname comience con href + '/'
    // y que no haya otra coincidencia más específica
    if (href !== '/dashboard' && pathname?.startsWith(href + '/')) {
      return true;
    }
    return false;
  };

  const isSubmenuActive = (children: NavItem[]) => {
    return children.some(child => child.href && isItemActive(child.href));
  };

  // ✅ OPTIMIZACIÓN: Memoizar logo para evitar re-calculos
  const logoConfig = useMemo(() => ({
    src: activeUnit === 'BARBERIA' ? '/logo-barberia.png' : '/logo-spa.png',
    alt: activeUnit === 'BARBERIA' ? 'Barbería' : 'SPA',
  }), [activeUnit]);

  const navContent = (
    <div className="flex h-full flex-col select-none">
      {/* Mobile Header */}
      <div className="flex items-center justify-between border-b border-[var(--unit-border)]/40 pb-4 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[var(--unit-accent)] animate-pulse" />
          <span className="font-heading text-base font-bold text-[var(--unit-text)] tracking-wide">Menú</span>
        </div>
        {onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            className="rounded-unit-sm border border-[var(--unit-border)]/60 bg-[var(--unit-surface-elevated)] p-1.5 text-[var(--unit-text-muted)] hover:text-[var(--unit-text)] hover:bg-[var(--unit-accent)]/10 transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="mt-4 flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-1 lg:mt-2" aria-label="Principal">
        {visible.map((item) => {
          if (item.children) {
            // Render submenu
            const isSubmenuOpen = openSubmenus[item.label] || isSubmenuActive(item.children);
            const hasActiveChild = isSubmenuActive(item.children);
            
            return (
              <div key={item.label} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleSubmenu(item.label)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-unit px-3.5 py-2.5 text-sm transition-all duration-200 group',
                    hasActiveChild
                      ? 'bg-[var(--unit-accent)]/15 text-[var(--unit-accent)] font-bold shadow-sm'
                      : 'text-[var(--unit-text-muted)] font-medium hover:bg-[var(--unit-surface-elevated)] hover:text-[var(--unit-text)]'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'transition-colors duration-200',
                      hasActiveChild ? 'text-[var(--unit-accent)]' : 'text-[var(--unit-text-muted)] group-hover:text-[var(--unit-accent)]'
                    )}>
                      {item.icon}
                    </span>
                    <span className="tracking-tight">{item.label}</span>
                  </div>
                  <ChevronDown className={cn(
                    'h-4 w-4 text-[var(--unit-text-muted)] transition-transform duration-200',
                    isSubmenuOpen ? 'rotate-180 text-[var(--unit-accent)]' : ''
                  )} />
                </button>
                
                {isSubmenuOpen && (
                  <div className="ml-4 pl-3 border-l-2 border-[var(--unit-border)]/40 space-y-1 pt-1 pb-1 animate-fade-in">
                    {item.children
                      .filter(child => child.roles.includes(role))
                      .map((child) => {
                        const isActive = child.href ? isItemActive(child.href) : false;
                        return (
                          <Link
                            key={child.href}
                            href={child.href || '#'}
                            onClick={onMobileClose}
                            onMouseEnter={() => child.href && prefetchRoute(child.href)}
                            onFocus={() => child.href && prefetchRoute(child.href)}
                            className={cn(
                              'flex items-center gap-2.5 rounded-unit-sm px-3 py-2 text-xs transition-all duration-150 group',
                              isActive
                                ? 'bg-[var(--unit-accent)] text-white font-bold shadow-unit-sm'
                                : 'text-[var(--unit-text-muted)] font-medium hover:bg-[var(--unit-surface-elevated)] hover:text-[var(--unit-text)]'
                            )}
                          >
                            <span className={cn(
                              'transition-colors',
                              isActive ? 'text-white' : 'group-hover:text-[var(--unit-accent)]'
                            )}>
                              {child.icon}
                            </span>
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          } else {
            // Render regular item
            const isActive = item.href ? isItemActive(item.href) : false;
            return (
              <Link
                key={item.href}
                href={item.href || '#'}
                onClick={onMobileClose}
                onMouseEnter={() => item.href && prefetchRoute(item.href)}
                onFocus={() => item.href && prefetchRoute(item.href)}
                className={cn(
                  'flex items-center gap-3 rounded-unit px-3.5 py-2.5 text-sm transition-all duration-200 group',
                  isActive
                    ? 'bg-[var(--unit-accent)] text-white font-bold shadow-unit-sm'
                    : 'text-[var(--unit-text-muted)] font-medium hover:bg-[var(--unit-surface-elevated)] hover:text-[var(--unit-text)]'
                )}
              >
                <span className={cn(
                  'transition-colors duration-200',
                  isActive ? 'text-white' : 'text-[var(--unit-text-muted)] group-hover:text-[var(--unit-accent)]'
                )}>
                  {item.icon}
                </span>
                <span className="tracking-tight">{item.label}</span>
              </Link>
            );
          }
        })}
      </nav>

      {/* Unit Logo */}
      <div className="mt-auto border-t border-[var(--unit-border)]/40 pt-4 pb-1">
        <div className="flex flex-col items-center">
          <div className="relative overflow-hidden rounded-unit-lg border border-[var(--unit-border)]/50 bg-[var(--unit-surface-elevated)] p-2.5 group hover:border-[var(--unit-accent)]/40 hover:shadow-unit-sm transition-all duration-300">
            <Image
              src={logoConfig.src}
              alt={logoConfig.alt}
              width={72}
              height={72}
              className="relative h-10 w-auto object-contain opacity-90 transition-opacity group-hover:opacity-100"
              priority={false}
            />
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--unit-accent)] shadow-[0_0_8px_var(--unit-accent)]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--unit-text)]">
              {logoConfig.alt}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Backdrop móvil */}
      {onMobileClose && (
        <div
          className={cn(
            'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden',
            mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          )}
          onClick={onMobileClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          'w-56 border-r border-[var(--unit-border)]/40 bg-[var(--unit-surface)] shadow-unit p-4 flex flex-col',
          'fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:fixed lg:top-0 lg:left-0 lg:inset-y-0 lg:z-40',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {navContent}
      </aside>
    </>
  );
}

// ✅ OPTIMIZACIÓN: Memoizar el componente completo
export const SidebarMemo = memo(Sidebar);
SidebarMemo.displayName = 'SidebarMemo';
