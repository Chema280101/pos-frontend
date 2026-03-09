'use client';

import React, { type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import type { BusinessUnit } from '@/lib/theme';

export interface UnitGuardProps {
  children: ReactNode;
  unit: BusinessUnit;
}

export function UnitGuard({ children, unit }: UnitGuardProps): React.ReactNode {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <>{children}</>;
  }
  if (user.role === 'ADMIN') {
    return <>{children}</>;
  }
  if (user.unit !== unit) {
    if (typeof window !== 'undefined') {
      router.replace('/error/403');
    }
    return null;
  }
  return <>{children}</>;
}
