'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getPageTitle } from '@/lib/metadata';

/**
 * Hook para actualizar dinámicamente el título de la página
 */
export function usePageTitle(): void {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined' && pathname) {
      document.title = getPageTitle(pathname);
    }
  }, [pathname]);
}
