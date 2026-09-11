'use client';

import { RoleGuard } from '@/guards/RoleGuard';
import { AdminCommissions } from '@/features/commissions/AdminCommissions';
import type { UserRole } from '@/types/auth';

export default function Page(): JSX.Element {
  return (
    <RoleGuard allowedRoles={['ADMIN', 'RECEPTIONIST'] as UserRole[]}>
      <AdminCommissions />
    </RoleGuard>
  );
}
