'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';

export default function LockedPage(): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div className="rounded-full bg-red-100 p-4">
        <Lock className="h-12 w-12 text-red-600" aria-hidden />
      </div>
      <h1 className="font-heading text-2xl font-semibold text-[var(--unit-text)]">
        Cuenta bloqueada
      </h1>
      <p className="max-w-md text-center text-[var(--unit-text)]/80">
        Tu cuenta ha sido bloqueada por múltiples intentos fallidos de inicio de sesión.
        Contacta al administrador para desbloquearla.
      </p>
      <Link
        href="/login"
        className="rounded-[var(--unit-border-radius)] bg-[var(--unit-accent)] px-4 py-2 font-medium text-white hover:opacity-90"
      >
        Volver al login
      </Link>
    </div>
  );
}
