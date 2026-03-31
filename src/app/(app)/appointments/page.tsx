'use client';

import { RoleGuard } from '@/guards/RoleGuard';
import { AppointmentsPage } from '@/features/appointments/AppointmentsPage';
import type { UserRole } from '@/types/auth';

export default function Page(): JSX.Element {
  return (
    <RoleGuard allowedRoles={['ADMIN', 'RECEPTIONIST', 'SPA_SPECIALIST', 'BARBER'] as UserRole[]}>
      <AppointmentsPage />
    </RoleGuard>
  );
}
