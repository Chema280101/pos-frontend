'use client';

import { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUnitStore } from '@/store/unitStore';
import { useSocket } from '@/hooks/useSocket';
import { useApprovalNotifications } from '@/hooks/useApprovalNotifications';
import { cn } from '@/lib/utils';
import { RoleGuard } from '@/guards/RoleGuard';
import { 
  Sparkles, 
  Calendar, 
  CreditCard, 
  Plus, 
  RefreshCw, 
  TrendingUp, 
  Activity, 
  Scissors, 
  Layers 
} from 'lucide-react';

// Lazy loading for unit dashboards
const DashboardSPA = lazy(() => import('./DashboardSPA').then(mod => ({ default: mod.DashboardSPA })));
const DashboardBarberia = lazy(() => import('./DashboardBarberia').then(mod => ({ default: mod.DashboardBarberia })));
const DashboardConsolidado = lazy(() => import('./DashboardConsolidado').then(mod => ({ default: mod.DashboardConsolidado })));

type DashboardView = 'SPA' | 'BARBERIA' | 'CONSOLIDADO';

export function DashboardPage(): JSX.Element {
  return (
    <RoleGuard minRole="ADMIN">
      <DashboardContent />
    </RoleGuard>
  );
}

function DashboardContent(): JSX.Element {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const activeUnit = useUnitStore((s) => s.activeUnit);
  const setUnit = useUnitStore((s) => s.setUnit);
  const isAdmin = user?.role === 'ADMIN';
  const userUnit = user?.unit ?? null;

  useSocket();
  useApprovalNotifications();

  // Determine initial view based on activeUnit / userUnit
  const initialView: DashboardView = activeUnit === 'BARBERIA' 
    ? 'BARBERIA' 
    : activeUnit === 'SPA' 
    ? 'SPA' 
    : 'CONSOLIDADO';

  const [activeView, setActiveView] = useState<DashboardView>(initialView);

  // Sync activeView when activeUnit changes from the global toggle
  useEffect(() => {
    if (activeUnit === 'BARBERIA' || activeUnit === 'SPA') {
      setActiveView(activeUnit);
    }
  }, [activeUnit]);

  // Greeting based on current time
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
      <div className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Top Header & Fast Actions (Agenda Style) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--unit-border)]/40 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] text-xs font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--unit-accent)] animate-pulse" />
                Panel Ejecutivo • {activeView === 'BARBERIA' ? 'Barbería' : activeView === 'SPA' ? 'SPA' : 'Consolidado'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--unit-text)] tracking-tight">
              {greeting}, <span className="text-[var(--unit-accent)]">{user?.name?.split(' ')[0] ?? 'Administrador'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-[var(--unit-text-muted)]">
              Métricas financieras, productividad de especialistas y flujo operativo en tiempo real
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-1 sm:pb-0">
            <Link
              href="/appointments"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-xs font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-all shadow-unit-sm shrink-0"
            >
              <Calendar className="h-4 w-4 text-[var(--unit-accent)]" />
              <span className="hidden sm:inline">Ver Agenda</span>
            </Link>

            <Link
              href="/pos"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-xs font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-all shadow-unit-sm shrink-0"
            >
              <CreditCard className="h-4 w-4 text-emerald-600" />
              <span className="hidden sm:inline">Abrir POS</span>
            </Link>

            <Link
              href="/appointments/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-unit bg-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/90 text-white text-xs font-bold transition-all shadow-unit active:scale-[0.98] shrink-0"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Nueva Cita</span>
              <span className="sm:hidden">Nueva Cita</span>
            </Link>
          </div>
        </div>

        {/* View Switcher Tabs (Agenda Pill Style) */}
        {tabs.length > 0 && (
          <div className="flex items-center gap-1.5 p-1 bg-[var(--unit-surface-elevated)] rounded-unit-lg border border-[var(--unit-border)]/40 w-full sm:w-fit overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveView(tab.key);
                  if (tab.key === 'SPA' || tab.key === 'BARBERIA') {
                    setUnit(tab.key);
                  }
                }}
                className={cn(
                  'px-4 py-2 rounded-unit text-xs font-bold transition-all',
                  activeView === tab.key
                    ? 'bg-[var(--unit-accent)] text-white shadow-unit-sm'
                    : 'text-[var(--unit-text-muted)] hover:text-[var(--unit-text)]'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Dashboard Content with Suspense */}
        <div className="space-y-8">
          <Suspense fallback={
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-[var(--unit-surface-elevated)] rounded-unit-lg border border-[var(--unit-border)]/30 animate-pulse" />
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
