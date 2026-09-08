'use client';

import Link from 'next/link';
import { Scissors, Calendar, Shield, Sparkles, HelpCircle, MessageCircle, Heart, CheckCircle2 } from 'lucide-react';

export function Footer(): JSX.Element {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="relative overflow-hidden border-t border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)]/90 backdrop-blur-xl mt-auto">
      <div className="relative px-4 sm:px-6 py-5 max-w-7xl mx-auto">
        {/* Main Content */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand Section */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-unit bg-[var(--unit-accent)] text-white shadow-unit-sm">
              <Scissors className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-[var(--unit-text)] tracking-tight">
                  Barbería & Spa POS
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--unit-accent)]/10 text-[var(--unit-accent)]">
                  v2.0
                </span>
              </div>
              <p className="text-xs font-medium text-[var(--unit-text-muted)]">
                Plataforma de gestión empresarial inteligente
              </p>
            </div>
          </div>

          {/* Quick Links & Actions */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <a 
              href="/docs/manual-de-usuario.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-[var(--unit-text-muted)] hover:text-[var(--unit-text)] bg-[var(--unit-surface)] hover:bg-[var(--unit-surface-elevated)] border border-[var(--unit-border)]/60 transition-all duration-150 shadow-sm"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Manual PDF</span>
            </a>
            <Link 
              href="/ayuda"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-[var(--unit-text-muted)] hover:text-[var(--unit-text)] bg-[var(--unit-surface)] hover:bg-[var(--unit-surface-elevated)] border border-[var(--unit-border)]/60 transition-all duration-150 shadow-sm"
            >
              <HelpCircle className="h-3.5 w-3.5 text-blue-500" />
              <span>Guía Web</span>
            </Link>
            <a 
              href="https://wa.me/51951171534?text=Hola%2C%20necesito%20soporte%20con%20el%20sistema%20Barber%C3%ADa%20y%20Spa%20POS"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all duration-150 shadow-sm"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Soporte WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Bottom Sub-bar */}
        <div className="mt-4 pt-4 border-t border-[var(--unit-border)]/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-medium text-[var(--unit-text-muted)]">
          <div className="flex items-center gap-3">
            <span>© {currentYear} Todos los derechos reservados</span>
            <span className="hidden sm:inline text-[var(--unit-border)]">•</span>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
              <CheckCircle2 className="h-3.5 w-3.5" /> Servidor Activo
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span>Desarrollado con</span>
            <Heart className="h-3 w-3 text-rose-500 fill-rose-500 animate-pulse mx-0.5" />
            <span>para potenciar tu negocio</span>
            <Sparkles className="h-3 w-3 text-[var(--unit-accent)] ml-1" />
          </div>
        </div>
      </div>
    </footer>
  );
}
