'use client';

import { RoleGuard } from '@/guards/RoleGuard';
import { MyCommissions } from '@/features/commissions/MyCommissions';
import type { UserRole } from '@/types/auth';

export default function Page(): JSX.Element {
  return (
    <RoleGuard allowedRoles={['ADMIN', 'RECEPTIONIST', 'SPA_SPECIALIST', 'BARBER'] as UserRole[]}>
      <MyCommissions />
    </RoleGuard>
  );
}
