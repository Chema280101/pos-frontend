'use client';

import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types/auth';

const ROLE_ORDER: UserRole[] = ['BARBER', 'SPA_SPECIALIST', 'RECEPTIONIST', 'ADMIN'];

function roleLevel(r: UserRole): number {
  const i = ROLE_ORDER.indexOf(r);
  return i >= 0 ? i : -1;
}

export function usePermissions(): {
  can: (minRole: UserRole) => boolean;
  isAdmin: boolean;
} {
  const user = useAuthStore((s) => s.user);
  const can = (minRole: UserRole): boolean => {
    if (!user) return false;
    return roleLevel(user.role) >= roleLevel(minRole);
  };
  return {
    can,
    isAdmin: user?.role === 'ADMIN',
  };
}
