'use client';

import { useState, useEffect } from 'react';
import { useUnit } from './useUnit';
import { applyUnitTheme } from '@/lib/theme';
import type { BusinessUnit } from '@/lib/theme';

export function useTheme(): {
  unit: BusinessUnit | null;
  setUnit: (unit: BusinessUnit | null) => void;
  isDark: boolean;
  toggleDark: () => void;
  setDark: (dark: boolean) => void;
} {
  const { activeUnit, setUnit } = useUnit();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Verificar el tema actual al montar
    const html = document.documentElement;
    const currentTheme = html.classList.contains('dark');
    setIsDark(currentTheme);

    // Verificar preferencia del sistema
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (!localStorage.getItem('theme') && prefersDark) {
      html.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const toggleDark = (): void => {
    const html = document.documentElement;
    const newTheme = !isDark;
    
    if (newTheme) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    
    setIsDark(newTheme);
  };

  const setDark = (dark: boolean): void => {
    const html = document.documentElement;
    
    if (dark) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    
    setIsDark(dark);
  };

  return { unit: activeUnit, setUnit, isDark, toggleDark, setDark };
}
