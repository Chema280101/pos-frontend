'use client';

import { RoleGuard } from '@/guards/RoleGuard';
import { POSPage } from '@/features/pos/POSPage';

export default function Page(): JSX.Element {
  return (
    <RoleGuard minRole="RECEPTIONIST">
      <POSPage />
    </RoleGuard>
  );
}
