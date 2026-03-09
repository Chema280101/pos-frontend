'use client';

import { useAuthStore } from '@/store/authStore';

export function useAuth(): {
  user: ReturnType<typeof useAuthStore.getState>['user'];
  isLoading: boolean;
  isAuthenticated: boolean;
} {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
