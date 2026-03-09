'use client';

import { useEffect, useState, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { SkeletonLoader } from '@/components/ui';
import { routePermissions, hasRole } from '@/lib/permissions';

const PUBLIC_PATHS = [
  '/login',
  '/change-password',
  '/error/locked',
  '/error/403',
  '/error/404',
];

const CHANGE_PASSWORD_PATH = '/change-password';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  // ✅ OPTIMIZACIÓN: Memoizar cálculos de ruta
  const routeChecks = useMemo(() => {
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname?.startsWith(p + '/')
  );
  const isChangePassword = pathname === CHANGE_PASSWORD_PATH;
    const requiredRoles = routePermissions[pathname];
    
    return { isPublic, isChangePassword, requiredRoles };
  }, [pathname]);

  // ✅ OPTIMIZACIÓN: Obtener estado de auth una sola vez
  const authState = useAuthStore((s) => ({
    user: s.user,
    accessToken: s.accessToken,
  }));

  useEffect(() => {
    // Si es ruta pública, no verificar
    if (routeChecks.isPublic) {
      setChecking(false);
      return;
    }

    const run = async () => {
      const { user, accessToken } = authState;

      // ✅ OPTIMIZACIÓN: Si ya tenemos sesión válida, verificar permisos locales
      if (user && accessToken) {
        // Verificar cambio de contraseña requerido
        if (user.mustChangePassword && !routeChecks.isChangePassword) {
          router.replace(CHANGE_PASSWORD_PATH);
          return;
        }
        
        // Verificar permisos de ruta (sin hacer refresh)
        if (routeChecks.requiredRoles && !hasRole(user, routeChecks.requiredRoles)) {
          router.replace('/error/403');
          return;
        }
        
        setChecking(false);
        return;
      }

      // Solo hacer refresh si no hay sesión
      const store = useAuthStore.getState();
      const ok = await store.tryRefresh();

      if (!ok) {
        router.replace('/login');
        return;
      }

      const updatedUser = store.user;

      // Verificar permisos después del refresh
      if (routeChecks.requiredRoles && !hasRole(updatedUser, routeChecks.requiredRoles)) {
        router.replace('/error/403');
        return;
      }

      if (updatedUser?.mustChangePassword && !routeChecks.isChangePassword) {
        router.replace(CHANGE_PASSWORD_PATH);
        return;
      }

      setChecking(false);
    };

    // ✅ TIMEOUT: Si después de 2 segundos no hay respuesta, continuar
    const timeoutId = setTimeout(() => {
      if (checking) {
        setChecking(false);
      }
    }, 2000);

    run().finally(() => {
      clearTimeout(timeoutId);
    });
  }, [pathname]);

  // Early returns al final - después de todos los hooks
  if (routeChecks.isPublic) {
    return <>{children}</>;
  }

  // OPTIMIZACIÓN: Solo mostrar loading por máximo 2 segundos
  if (checking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <svg
          className="h-8 w-8 animate-spin text-[var(--unit-accent)]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>

        <p className="text-[var(--unit-text-muted)]">
          Cargando aplicación...
        </p>

        <div className="mt-2 w-full max-w-md">
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}