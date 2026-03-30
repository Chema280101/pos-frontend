'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useUnitStore } from '@/store/unitStore';
import { applyUnitTheme } from '@/lib/theme';
import { setOnTokenUpdate } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { ModalStackProvider } from '@/hooks/useModalStack';

function ThemeSync(): null {
  const activeUnit = useUnitStore((s) => s.activeUnit);
  useEffect(() => {
    applyUnitTheme(activeUnit);
  }, [activeUnit]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }): JSX.Element {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30 * 1000 },
        },
      })
  );
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ✅ Exponer queryClient globalmente para acceso desde authStore
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.queryClient = queryClient;
    }
  }, [queryClient]);

  useEffect(() => {
    if (!mounted) return;
  
    setOnTokenUpdate((token) => {
      if (!token) {
        // Solo limpiar sesión si no estamos ya en el proceso de limpiarla
        const store = useAuthStore.getState();
        if (store.user || store.accessToken) {
          store.clearSession();
        }
      }
    });
  }, [mounted]);

  return (
    <QueryClientProvider client={queryClient}>
      <ModalStackProvider>
        {mounted && <ThemeSync />}
        {children}
      </ModalStackProvider>
    </QueryClientProvider>
  );
}
