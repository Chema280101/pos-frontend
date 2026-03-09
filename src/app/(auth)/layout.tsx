'use client';

/**
 * Layout para rutas de autenticación (login, change-password).
 * Solo envuelve con un contenedor mínimo; no incluye Sidebar ni Header.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return <>{children}</>;
}
