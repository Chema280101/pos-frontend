'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useUnitStore } from '@/store/unitStore';
import { applyUnitTheme } from '@/lib/theme';
import { setOnTokenUpdate } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

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
      {mounted && <ThemeSync />}
      {children}
    </QueryClientProvider>
  );
}
