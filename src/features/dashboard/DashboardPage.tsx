'use client';

import { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUnitStore } from '@/store/unitStore';
import { cn } from '@/lib/utils';
import { RoleGuard } from '@/guards/RoleGuard';
// ✅ OPTIMIZACIÓN: Lazy loading para componentes pesados
const DashboardSPA = lazy(() => import('./DashboardSPA').then(mod => ({ default: mod.DashboardSPA })));
const DashboardBarberia = lazy(() => import('./DashboardBarberia').then(mod => ({ default: mod.DashboardBarberia })));
const DashboardConsolidado = lazy(() => import('./DashboardConsolidado').then(mod => ({ default: mod.DashboardConsolidado })));

type DashboardView = 'SPA' | 'BARBERIA' | 'CONSOLIDADO';

export function DashboardPage(): JSX.Element {
  const user = useAuthStore((s) => s.user);
  
  // Solo ADMIN puede acceder al dashboard financiero
  return (
    <RoleGuard minRole="ADMIN">
      <DashboardContent />
    </RoleGuard>
  );
}

function DashboardContent(): JSX.Element {
  const user = useAuthStore((s) => s.user);
  const activeUnit = useUnitStore((s) => s.activeUnit);
  const isAdmin = user?.role === 'ADMIN';
  const userUnit = user?.unit ?? null;

  // ✅ OPTIMIZACIÓN: Memoizar logo para evitar re-calculos
  const logoConfig = useMemo(() => ({
    src: activeUnit === 'BARBERIA' ? '/logo-barberia.png' : '/logo-spa.png',
    alt: activeUnit === 'BARBERIA' ? 'Barbería' : 'SPA',
  }), [activeUnit]);

  const defaultView: DashboardView = userUnit === 'BARBERIA'
    ? 'BARBERIA'
    : userUnit === 'SPA'
      ? 'SPA'
      : 'CONSOLIDADO';

  const [activeView, setActiveView] = useState<DashboardView>(defaultView);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  const tabs: { key: DashboardView; label: string }[] = isAdmin
    ? [
        { key: 'SPA', label: 'SPA' },
        { key: 'CONSOLIDADO', label: 'Consolidado' },
        { key: 'BARBERIA', label: 'Barbería' },
      ]
    : [];

  return (
    <div className="relative min-h-screen bg-[var(--unit-surface)] overflow-hidden">
      {/* Watermark logo */}
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center" aria-hidden>
        <Image
          src={logoConfig.src}
          alt={logoConfig.alt}
          width={500}
          height={500}
          className="h-[45vh] w-auto object-contain opacity-[0.04] select-none"
          priority={false}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="bg-gradient-to-r from-[var(--unit-primary)]/5 to-[var(--unit-accent)]/5 rounded-[var(--unit-border-radius)] p-6 border border-[var(--unit-border)]/20">
            <h1 className="text-3xl font-bold text-[var(--unit-text)] mb-2">
              {greeting}, <span className="text-[var(--unit-accent)]">{user?.name?.split(' ')[0] ?? 'Usuario'}</span>
            </h1>
            <p className="text-[var(--unit-text-muted)] text-sm font-medium uppercase tracking-wider">
              {user?.role}
              {user?.unit ? ` · ${user.unit}` : ' · Todas las unidades'}
            </p>
          </div>
          
          {/* Quick stats */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-[var(--unit-text-muted)] uppercase tracking-wider">Unidad activa</p>
              <p className="text-lg font-bold text-[var(--unit-text)]">{activeUnit || 'Global'}</p>
            </div>
            <div className="w-px h-12 bg-[var(--unit-border)]"></div>
            <div className="text-right">
              <p className="text-xs text-[var(--unit-text-muted)] uppercase tracking-wider">Vista actual</p>
              <p className="text-lg font-bold text-[var(--unit-accent)]">{activeView}</p>
            </div>
          </div>
        </div>

        {/* View tabs (Admin only) */}
        {tabs.length > 0 && (
          <div className="mb-8">
            <div className="inline-flex gap-1 rounded-[var(--unit-border-radius)] bg-[var(--unit-surface-elevated)] p-1 border border-[var(--unit-border)]/30 shadow-[var(--unit-shadow)]">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveView(tab.key)}
                  className={cn(
                    'relative px-6 py-3 text-base font-semibold rounded-[var(--unit-radius-sm)] transition-all duration-200',
                    activeView === tab.key
                      ? 'bg-[var(--unit-accent)] text-white shadow-lg shadow-[var(--unit-accent)]/25 scale-[1.02]'
                      : 'text-[var(--unit-text-muted)] hover:text-[var(--unit-text)] hover:bg-[var(--unit-primary)]/10'
                  )}
                >
                  {tab.label}
                  {activeView === tab.key && (
                    <div className="absolute inset-0 rounded-[var(--unit-radius-sm)] bg-gradient-to-r from-[var(--unit-accent)]/20 to-transparent pointer-events-none"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dashboard content */}
        <div className="space-y-8">
          <Suspense fallback={
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[140px] bg-[var(--unit-surface-elevated)] rounded-[var(--unit-border-radius)] border border-[var(--unit-border)]/30 animate-pulse"></div>
              ))}
            </div>
          }>
              {activeView === 'SPA' && <DashboardSPA />}
              {activeView === 'BARBERIA' && <DashboardBarberia />}
              {activeView === 'CONSOLIDADO' && <DashboardConsolidado />}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
