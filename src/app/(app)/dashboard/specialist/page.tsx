'use client';

import dynamic from 'next/dynamic';
import { RoleGuard } from '@/guards/RoleGuard';

// ✅ Lazy loading para DashboardSpecialist
const DashboardSpecialist = dynamic(() => import('@/features/dashboard/DashboardSpecialist').then(mod => ({ default: mod.DashboardSpecialist })), {
  loading: () => (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-[140px] bg-[var(--unit-surface-elevated)] rounded-[var(--unit-border-radius)] border border-[var(--unit-border)]/30 animate-pulse"></div>
      ))}
    </div>
  ),
  ssr: false
});

export default function Page(): JSX.Element {
  return (
    <RoleGuard minRole="SPA_SPECIALIST">
      <DashboardSpecialist />
    </RoleGuard>
  );
}
