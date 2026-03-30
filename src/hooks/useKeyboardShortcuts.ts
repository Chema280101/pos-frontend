'use client';

import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const pressedShortcut = shortcuts.find(shortcut => {
      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.altKey ? event.altKey : !event.altKey;
      
      return keyMatch && ctrlMatch && shiftMatch && altMatch;
    });

    if (pressedShortcut) {
      event.preventDefault();
      event.stopPropagation();
      pressedShortcut.action();
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

// Atajos de teclado predefinidos para la aplicación
export const commonShortcuts = {
  // Guardar
  save: {
    key: 's',
    ctrlKey: true,
    description: 'Guardar (Ctrl+S)'
  },
  
  // Crear nuevo
  createNew: {
    key: 'n',
    ctrlKey: true,
    description: 'Crear nuevo (Ctrl+N)'
  },
  
  // Buscar
  search: {
    key: 'f',
    ctrlKey: true,
    description: 'Buscar (Ctrl+F)'
  },
  
  // Editar
  edit: {
    key: 'e',
    ctrlKey: true,
    description: 'Editar (Ctrl+E)'
  },
  
  // Eliminar
  delete: {
    key: 'Delete',
    description: 'Eliminar (Delete)'
  },
  
  // Cancelar
  cancel: {
    key: 'Escape',
    description: 'Cancelar (Escape)'
  },
  
  // Refrescar
  refresh: {
    key: 'r',
    ctrlKey: true,
    description: 'Refrescar (Ctrl+R)'
  },
  
  // Imprimir
  print: {
    key: 'p',
    ctrlKey: true,
    description: 'Imprimir (Ctrl+P)'
  },
  
  // Deshacer
  undo: {
    key: 'z',
    ctrlKey: true,
    description: 'Deshacer (Ctrl+Z)'
  },
  
  // Rehacer
  redo: {
    key: 'y',
    ctrlKey: true,
    description: 'Rehacer (Ctrl+Y)'
  },
  
  // Seleccionar todo
  selectAll: {
    key: 'a',
    ctrlKey: true,
    description: 'Seleccionar todo (Ctrl+A)'
  }
};
