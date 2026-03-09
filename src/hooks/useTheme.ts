'use client';

import { useUnit } from './useUnit';
import { applyUnitTheme } from '@/lib/theme';
import type { BusinessUnit } from '@/lib/theme';

export function useTheme(): {
  unit: BusinessUnit | null;
  setUnit: (unit: BusinessUnit | null) => void;
} {
  const { activeUnit, setUnit } = useUnit();
  return { unit: activeUnit, setUnit };
}
