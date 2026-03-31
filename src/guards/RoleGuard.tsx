'use client';

import React, { type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types/auth';

const ROLE_ORDER: UserRole[] = ['BARBER', 'SPA_SPECIALIST', 'RECEPTIONIST', 'ADMIN'];

function roleLevel(r: UserRole): number {
  const i = ROLE_ORDER.indexOf(r);
  return i >= 0 ? i : -1;
}

export interface RoleGuardProps {
  children: ReactNode;
  minRole?: UserRole;
  allowedRoles?: UserRole[];
}

export function RoleGuard({ children, minRole, allowedRoles }: RoleGuardProps): React.ReactNode {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <>{children}</>;
  }

  // Si se especifican allowedRoles, usar esa lógica
  if (allowedRoles) {
    if (!allowedRoles.includes(user.role)) {
      if (typeof window !== 'undefined') {
        router.replace('/error/403');
      }
      return null;
    }
  } 
  // Si no hay allowedRoles, usar minRole
  else if (minRole && roleLevel(user.role) < roleLevel(minRole)) {
    if (typeof window !== 'undefined') {
      router.replace('/error/403');
    }
    return null;
  }
  return <>{children}</>;
}
