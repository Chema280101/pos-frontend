import Link from 'next/link';

export default function ForbiddenPage(): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="font-heading text-2xl font-semibold text-[var(--unit-text)]">
        No tienes permiso para acceder a esta sección
      </h1>
      <Link href="/" className="text-[var(--unit-accent)] underline hover:no-underline">
        Volver al inicio
      </Link>
    </div>
  );
}
