'use client';

import { Moon, Sun } from 'lucide-react';
import { useDarkMode } from './DarkModeProvider';

export function ThemeToggle(): JSX.Element {
  const { isDark, toggleDark } = useDarkMode();

  return (
    <button
      onClick={toggleDark}
      className="relative inline-flex items-center justify-center p-2 rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)] hover:bg-[var(--unit-surface-elevated)] transition-all duration-200 hover:scale-105 active:scale-95 transition-theme"
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      <div className="relative h-5 w-5">
        <Sun 
          className={`absolute inset-0 h-5 w-5 text-[var(--unit-accent)] transition-all duration-300 ${
            isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
          }`} 
        />
        <Moon 
          className={`absolute inset-0 h-5 w-5 text-[var(--unit-accent)] transition-all duration-300 ${
            isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
          }`} 
        />
      </div>
    </button>
  );
}
