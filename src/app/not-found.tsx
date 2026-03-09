import Link from 'next/link';
import { Home, Scissors, Search, ArrowRight } from 'lucide-react';

export default function NotFound(): JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="h-full w-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='20' cy='20' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      {/* Main Content */}
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 p-6">
        {/* Error Card */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-8 max-w-md w-full">
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-50"></div>
          
          {/* Content */}
          <div className="relative z-10 text-center space-y-6">
            {/* Icon Container */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border-2 border-[var(--unit-border)]/50 shadow-lg">
                  <Search className="h-10 w-10 text-[var(--unit-accent)]" />
                </div>
                {/* Floating Icons */}
                <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg animate-bounce">
                  <Scissors className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            
            {/* Error Text */}
            <div className="space-y-3">
              <h1 className="font-heading text-3xl font-bold text-[var(--unit-text)]">
                404
              </h1>
              <h2 className="font-heading text-xl font-semibold text-[var(--unit-text)]">
                Página no encontrada
              </h2>
              <p className="text-[var(--unit-text-muted)] leading-relaxed">
                Ups! La página que buscas no existe o ha sido movida. 
                <br />
                No te preocupes, te ayudamos a volver al inicio.
              </p>
            </div>
            
            {/* Action Button */}
            <Link 
              href="/" 
              className="inline-flex items-center gap-3 rounded-xl border-2 border-[var(--unit-accent)]/50 bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] px-8 py-4 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 group"
            >
              <Home className="h-5 w-5" />
              Volver al inicio
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
        
        {/* Additional Info */}
        <div className="text-center space-y-2">
          <p className="text-sm text-[var(--unit-text-muted)]">
            Barbería y Spa POS
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-[var(--unit-text-muted)]/50">
            <span>Sistema de gestión profesional</span>
            <span>•</span>
            <span>v2.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
