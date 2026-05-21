'use client';

import { useState } from 'react';
import { X, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';

export function KeyboardShortcutsHelp(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { key: 'ESC', description: 'Cerrar modales o ventanas emergentes' },
    { key: 'Tab', description: 'Navegar entre elementos interactivos' },
    { key: 'Shift + Tab', description: 'Navegar hacia atrás entre elementos' },
    { key: 'Enter', description: 'Activar botones o enviar formularios' },
    { key: 'Space', description: 'Activar checkboxes o botones' },
    { key: 'Arrow Keys', description: 'Navegar en listas y tablas' },
    { key: 'Home / End', description: 'Ir al inicio o final de una lista' },
    { key: 'Page Up / Down', description: 'Desplazarse por páginas' },
  ];

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 px-4 py-2 bg-[var(--unit-accent)] text-white rounded-xl shadow-lg hover:bg-[var(--unit-accent-hover)] transition-all duration-200 hover:scale-105"
        aria-label="Mostrar atajos de teclado"
      >
        <Keyboard className="h-5 w-5" />
        <span className="hidden sm:inline text-sm font-medium">Atajos</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-[var(--unit-border)]/50">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--unit-border)]/30">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <Keyboard className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[var(--unit-text)]">
                  Atajos de Teclado
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)]/50 text-[var(--unit-text-muted)] transition-all duration-200 hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10 hover:text-[var(--unit-accent)]"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
              {shortcuts.map((shortcut) => (
                <div
                  key={shortcut.key}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--unit-surface)]/50 border border-[var(--unit-border)]/30"
                >
                  <kbd
                    className={cn(
                      'px-3 py-1.5 text-xs font-bold rounded-lg border-2',
                      'bg-[var(--unit-surface)] border-[var(--unit-border)]/50 text-[var(--unit-text)]',
                      'shadow-sm'
                    )}
                  >
                    {shortcut.key}
                  </kbd>
                  <span className="text-sm text-[var(--unit-text-muted)]">
                    {shortcut.description}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--unit-border)]/30 text-center">
              <p className="text-xs text-[var(--unit-text-muted)]">
                Presiona ESC para cerrar esta ventana
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
