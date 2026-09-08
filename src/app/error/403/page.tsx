'use client';

import Link from 'next/link';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';

export default function ForbiddenPage(): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 bg-gradient-to-br from-[var(--unit-surface)] to-white">
      {/* Icono de acceso denegado */}
      <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-100/80 border-2 border-red-200/50 shadow-lg">
          <ShieldX className="h-12 w-12 text-red-600" />
        </div>
        {/* Efecto de pulso sutil */}
        <div className="absolute inset-0 h-24 w-24 rounded-full bg-red-100/40 animate-ping"></div>
      </div>

      {/* Contenido principal */}
      <div className="text-center space-y-4 max-w-md">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-bold text-[var(--unit-text)]">
            No tienes permiso para acceder
          </h1>
          <p className="text-lg text-[var(--unit-text-muted)]">
            Esta sección requiere privilegios de administrador. Contacta al personal de soporte si crees que esto es un error.
          </p>
        </div>

        {/* Información adicional */}
        <div className="rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)]/50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-[var(--unit-text-muted)]">
            <ShieldX className="h-4 w-4 text-red-500" />
            <span>Código de error: 403 - Acceso denegado</span>
          </div>
          <p className="text-xs text-[var(--unit-text-muted)] leading-relaxed">
            Los permisos de acceso están configurados para proteger la información sensible del sistema. 
            Si necesitas acceso a esta funcionalidad, solicita ayuda a un administrador.
          </p>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3 flex-wrap justify-center">
        <Link 
          href="/" 
          className="flex items-center gap-2 px-6 py-3 bg-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/90 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
        >
          <Home className="h-4 w-4" />
          Volver al inicio
        </Link>
        
        <button 
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-6 py-3 border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)]/50 text-[var(--unit-text)] font-medium rounded-xl hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10 transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Página anterior
        </button>
      </div>

      {/* Footer informativo */}
      <div className="text-center space-y-1 mt-8">
        <p className="text-xs text-[var(--unit-text-muted)]">
          Si continúas viendo este mensaje, por favor{" "}
          <Link href="/login" className="text-[var(--unit-accent)] hover:underline font-medium">
            inicia sesión nuevamente
          </Link>
        </p>
        <p className="text-xs text-[var(--unit-text-muted)]">
          Necesitas ayuda?{" "}
          <Link href="/appointments" className="text-[var(--unit-accent)] hover:underline font-medium">
            Ve a tu agenda
          </Link>
        </p>
      </div>
    </div>
  );
}
