'use client';

import { EmptyState } from '@/components/ui';

export default function Page(): JSX.Element {
  return (
    <>
      <h1 className="font-heading text-2xl font-semibold text-[var(--unit-text)] mb-6">
        Reportes programados
      </h1>
      <EmptyState
        title="Reportes programados"
        description="Configura reportes automáticos por frecuencia (diaria, semanal, mensual) y descarga el historial."
      />
    </>
  );
}
