'use client';

import { ReportsPage } from '@/features/reports/ReportsPage';
import { RoleGuard } from '@/guards/RoleGuard';

export default function Page(): JSX.Element {
  return (
    <RoleGuard minRole="ADMIN">
      <ReportsPage />
    </RoleGuard>
  );
}
