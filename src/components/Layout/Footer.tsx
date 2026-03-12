'use client';

import { Scissors, DollarSign, Code, Heart, Calendar, Shield, Sparkles, HelpCircle, MessageCircle } from 'lucide-react';

export function Footer(): JSX.Element {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="relative overflow-hidden border-2 border-[var(--unit-border)]/30 bg-gradient-to-r from-white/90 to-white/70 backdrop-blur-sm shadow-lg">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="h-full w-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='20' cy='20' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="relative px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Main Content */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
            {/* Brand Section */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                <Scissors className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--unit-text)]">Barbería y Spa POS</h3>
                <p className="text-sm text-[var(--unit-text-muted)]">Sistema de gestión profesional</p>
              </div>
            </div>

            {/* Info Section */}
            <div className="flex items-center gap-6 text-sm text-[var(--unit-text-muted)]">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>© {currentYear}</span>
              </div>
              <div className="flex items-center gap-1">
                <Code className="h-4 w-4" />
                <span>v2.0.0</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                <span>Seguro</span>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--unit-border)]/30">
            {/* Links */}
            <div className="flex items-center gap-4 text-sm">
              <a 
                href="/docs/Guia-Usuario-Barberia-Spa-POS.html"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[var(--unit-text-muted)] hover:text-[var(--unit-accent)] transition-colors group"
              >
                <HelpCircle className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span>Ayuda</span>
              </a>
              <a 
                href="https://wa.me/51951171534?text=Hola%2C%20necesito%20soporte%20con%20el%20sistema%20Barber%C3%ADa%20y%20Spa%20POS"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[var(--unit-text-muted)] hover:text-[var(--unit-accent)] transition-colors group"
              >
                <MessageCircle className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span>Soporte</span>
              </a>
            </div>

            {/* Made with Love */}
            <div className="flex items-center gap-1 text-sm text-[var(--unit-text-muted)]">
              <span>Hecho con</span>
              <Heart className="h-4 w-4 text-red-500 animate-pulse" />
              <span>para tu negocio</span>
              <Sparkles className="h-4 w-4 text-[var(--unit-accent]" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
