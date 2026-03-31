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
        // Redirigir según el rol del usuario
        switch (user.role) {
          case 'ADMIN':
            router.replace('/dashboard');
            break;
          case 'RECEPTIONIST':
            // Los cajeros van al POS según su unidad
            if (user.unit === 'SPA') {
              router.replace('/pos');
            } else {
              router.replace('/pos');
            }
            break;
          case 'SPA_SPECIALIST':
            // Los especialistas van directamente a su agenda
            router.replace('/appointments');
            break;
          case 'BARBER':
            // Los barberos van directamente a su agenda
            router.replace('/appointments');
            break;
          default:
            // Si no tiene rol definido, va a login
            router.replace('/login');
            break;
        }
        return;
      }
      const ok = await tryRefresh();
      if (cancelled) return;
      if (ok) {
        // Si no hay usuario, intentar refrescar y redirigir según rol
        const { user: refreshedUser } = useAuthStore.getState();
        
        if (refreshedUser) {
          switch (refreshedUser.role) {
            case 'ADMIN':
              router.replace('/dashboard');
              break;
            case 'RECEPTIONIST':
              router.replace('/pos');
              break;
            case 'SPA_SPECIALIST':
              router.replace('/appointments');
              break;
            case 'BARBER':
              router.replace('/appointments');
              break;
            default:
              router.replace('/login');
              break;
          }
        } else {
          router.replace('/login');
        }
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
