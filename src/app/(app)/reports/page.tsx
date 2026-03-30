'use client';

import dynamic from 'next/dynamic';
import { LazyReportPage } from '@/components/LazyLoad/LazyReportPage';
import { RoleGuard } from '@/guards/RoleGuard';

// ✅ OPTIMIZACIÓN: Lazy loading para ReportsPage
const ReportsPage = dynamic(() => import('@/features/reports/ReportsPage').then(mod => ({ default: mod.ReportsPage })), {
  loading: () => <LazyReportPage children={null} />,
  ssr: false
});

export default function Page(): JSX.Element {
  return (
    <RoleGuard minRole="ADMIN">
      <LazyReportPage>
        <ReportsPage />
      </LazyReportPage>
    </RoleGuard>
  );
}
