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
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, roles: ['ADMIN', 'RECEPTIONIST', 'SPA_SPECIALIST', 'BARBER'] },
  { href: '/clients', label: 'Clientes', icon: <Users className="h-5 w-5" />, roles: ['ADMIN', 'RECEPTIONIST', 'SPA_SPECIALIST', 'BARBER'] },
  { href: '/appointments', label: 'Agenda', icon: <Calendar className="h-5 w-5" />, roles: ['ADMIN', 'RECEPTIONIST', 'SPA_SPECIALIST', 'BARBER'] },
  { href: '/pos', label: 'POS', icon: <ShoppingCart className="h-5 w-5" />, roles: ['ADMIN', 'RECEPTIONIST', 'SPA_SPECIALIST', 'BARBER'] },
  { 
    label: 'Caja', 
    icon: <Wallet className="h-5 w-5" />, 
    roles: ['ADMIN', 'RECEPTIONIST', 'SPA_SPECIALIST', 'BARBER'],
    children: [
      { href: '/cash-register', label: 'Apertura/Cierre', icon: <Wallet className="h-4 w-4" />, roles: ['ADMIN', 'RECEPTIONIST', 'SPA_SPECIALIST', 'BARBER'] },
      { href: '/expenses', label: 'Gastos', icon: <Receipt className="h-4 w-4" />, roles: ['ADMIN', 'RECEPTIONIST'] },
      { href: '/income', label: 'Ingresos', icon: <TrendingUp className="h-4 w-4" />, roles: ['ADMIN', 'RECEPTIONIST'] },
    ]
  },
  { 
    label: 'Inventario', 
    icon: <Package className="h-5 w-5" />, 
    roles: ['ADMIN', 'RECEPTIONIST', 'SPA_SPECIALIST', 'BARBER'],
    children: [
      { href: '/inventory', label: 'Productos', icon: <Package className="h-4 w-4" />, roles: ['ADMIN', 'RECEPTIONIST', 'SPA_SPECIALIST', 'BARBER'] },
      { href: '/suppliers', label: 'Proveedores', icon: <Users className="h-4 w-4" />, roles: ['ADMIN', 'RECEPTIONIST'] },
    ]
  },
  { 
    label: 'Servicios', 
    icon: <Scissors className="h-5 w-5" />, 
    roles: ['ADMIN', 'RECEPTIONIST', 'SPA_SPECIALIST', 'BARBER'],
    children: [
      { href: '/services', label: 'Servicios', icon: <Scissors className="h-4 w-4" />, roles: ['ADMIN', 'RECEPTIONIST', 'SPA_SPECIALIST', 'BARBER'] },
      { href: '/packages', label: 'Paquetes', icon: <Package className="h-4 w-4" />, roles: ['ADMIN', 'RECEPTIONIST', 'SPA_SPECIALIST', 'BARBER'] },
    ]
  },
  { href: '/commissions', label: 'Comisiones', icon: <Percent className="h-5 w-5" />, roles: ['ADMIN', 'RECEPTIONIST', 'SPA_SPECIALIST', 'BARBER'] },
  { 
    label: 'Reportes', 
    icon: <FileText className="h-5 w-5" />, 
    roles: ['ADMIN', 'RECEPTIONIST'],
    children: [
      { href: '/reports', label: 'Reportes Generales', icon: <BarChart3 className="h-4 w-4" />, roles: ['ADMIN', 'RECEPTIONIST'] },
      { href: '/reports/detailed', label: 'Reportes Particulares', icon: <FileText className="h-4 w-4" />, roles: ['ADMIN', 'RECEPTIONIST'] },
    ]
  },
  { 
    label: 'Administración', 
    icon: <Settings className="h-5 w-5" />, 
    roles: ['ADMIN'],
    children: [
      { href: '/admin/users', label: 'Usuarios', icon: <ShieldCheck className="h-4 w-4" />, roles: ['ADMIN'] },
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
    setOpenSubmenus((prev: SubmenuState) => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const isItemActive = (href: string) => {
    if (href === '/reports') {
      return pathname === '/reports' || pathname === '/reports/overview';
    }
    return pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));
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
    <div className="flex h-full flex-col">
      {/* Mobile Header */}
      <div className="flex items-center justify-between border-b-2 border-[var(--unit-border)]/30 pb-4 lg:hidden">
        <span className="font-heading text-sm font-bold text-[var(--unit-text)]">Menú</span>
        {onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            className="rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)]/50 p-2 text-[var(--unit-text)] hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10 transition-all"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <nav className="mt-4 flex-1 space-y-1 lg:mt-0" aria-label="Principal">
        {visible.map((item) => {
          if (item.children) {
            // Render submenu
            const isSubmenuOpen = openSubmenus[item.label] || isSubmenuActive(item.children);
            const hasActiveChild = isSubmenuActive(item.children);
            
            return (
              <div key={item.label}>
                <button
                  type="button"
                  onClick={() => toggleSubmenu(item.label)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all duration-200 group',
                    hasActiveChild
                      ? 'border-[var(--unit-accent)]/50 bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 shadow-lg text-[var(--unit-text)]'
                      : 'border-[var(--unit-border)]/50 bg-[var(--unit-surface)]/50 text-[var(--unit-text)] hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'transition-colors',
                      hasActiveChild ? 'text-[var(--unit-accent)]' : 'text-[var(--unit-text-muted)] group-hover:text-[var(--unit-accent)]'
                    )}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  <span className={cn(
                    'transition-transform duration-200',
                    isSubmenuOpen ? 'rotate-180' : ''
                  )}>
                    <ChevronDown className="h-4 w-4 text-[var(--unit-text-muted)]" />
                  </span>
                </button>
                
                {isSubmenuOpen && (
                  <div className="ml-3 mt-2 space-y-2">
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
                              'flex items-center gap-3 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 group',
                              isActive
                                ? 'border-[var(--unit-accent)]/50 bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 shadow-lg text-[var(--unit-text)]'
                                : 'border-[var(--unit-border)]/30 bg-[var(--unit-surface)]/30 text-[var(--unit-text-muted)] hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10 hover:text-[var(--unit-text)]'
                            )}
                          >
                            <span className="transition-colors group-hover:text-[var(--unit-accent)]">
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
                'flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all duration-200 group',
                isActive
                  ? 'border-[var(--unit-accent)]/50 bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 shadow-lg text-[var(--unit-text)]'
                  : 'border-[var(--unit-border)]/50 bg-[var(--unit-surface)]/50 text-[var(--unit-text)] hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10'
              )}
            >
              <span className={cn(
                'transition-colors',
                isActive ? 'text-[var(--unit-accent)]' : 'text-[var(--unit-text-muted)] group-hover:text-[var(--unit-accent)]'
              )}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
          }
        })}
      </nav>

      {/* Unit Logo */}
      <div className="mt-auto border-t-2 border-[var(--unit-border)]/30 pt-6">
        <div className="flex flex-col items-center">
          <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm shadow-lg p-3 group">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
            <Image
              src={logoConfig.src}
              alt={logoConfig.alt}
              width={80}
              height={80}
              className="relative h-12 w-auto object-contain opacity-80 transition-opacity group-hover:opacity-100"
              priority={false}
            />
          </div>
          <span className="mt-3 text-xs font-bold uppercase tracking-widest text-[var(--unit-text-muted)]">
            {logoConfig.alt}
          </span>
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
            'fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden',
            mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          )}
          onClick={onMobileClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          'w-56 border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6',
          'fixed inset-y-0 left-0 z-50 transform transition-transform lg:relative lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
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
