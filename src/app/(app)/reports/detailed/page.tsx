import dynamic from 'next/dynamic';
import { Metadata } from 'next';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { RoleGuard } from '@/guards/RoleGuard';

export const metadata: Metadata = {
  title: 'Reportes Particulares - SPA & Barbería POS',
  description: 'Reportes detallados con filtros avanzados',
};

const DetailedReportsPage = dynamic(
  () => import('@/features/reports/DetailedReports').then(mod => ({ default: mod.DetailedReports })),
  {
    loading: () => (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded-lg w-1/3"></div>
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    ),
    ssr: false,
  }
);

export default function Page() {
  // Default values for props - use wider range for testing
  const unit = '';
  const dateFrom = startOfDay(subDays(new Date(), 30)); // 30 days ago instead of 7
  const dateTo = endOfDay(new Date());

  return (
    <RoleGuard minRole="ADMIN">
      <DetailedReportsPage unit={unit} dateFrom={dateFrom} dateTo={dateTo} />
    </RoleGuard>
  );
}
