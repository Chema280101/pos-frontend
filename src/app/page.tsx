'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

/**
 * Página raíz: redirige a /dashboard si hay sesión, o a /login si no.
 * Evita cargar el layout (app) cuando el usuario no está autenticado.
 */
export default function HomePage(): JSX.Element | null {
  const router = useRouter();
  const tryRefresh = useAuthStore((s) => s.tryRefresh);
  const setHydrated = useAuthStore((s) => s.setHydrated);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, [setHydrated]);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const { user, accessToken } = useAuthStore.getState();
      if (user && accessToken) {
        if (!cancelled) router.replace('/dashboard');
        return;
      }
      const ok = await tryRefresh();
      if (cancelled) return;
      if (ok) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
      setDone(true);
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [tryRefresh, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-[var(--unit-text)]/80">{done ? 'Redirigiendo...' : 'Cargando...'}</p>
    </div>
  );
}
