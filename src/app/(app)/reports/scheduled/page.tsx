'use client';

import { EmptyState } from '@/components/ui';

export default function Page(): JSX.Element {
  return (
    <div className="p-6">
      <h1 className="font-heading text-2xl font-semibold text-[var(--unit-text)]">
        Reportes programados
      </h1>
      <EmptyState
        title="Reportes programados"
        description="Configura reportes automáticos por frecuencia (diaria, semanal, mensual) y descarga el historial."
      />
    </div>
  );
}
