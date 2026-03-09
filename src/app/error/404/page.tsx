import Link from 'next/link';

export default function NotFoundPage(): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="font-heading text-2xl font-semibold text-[var(--unit-text)]">Página no encontrada</h1>
      <Link href="/" className="text-[var(--unit-accent)] underline hover:no-underline">
        Volver al inicio
      </Link>
    </div>
  );
}
