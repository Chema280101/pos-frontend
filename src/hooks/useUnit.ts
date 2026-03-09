'use client';

import { useUnitStore } from '@/store/unitStore';
import type { BusinessUnit } from '@/lib/theme';

export function useUnit(): {
  activeUnit: BusinessUnit | null;
  setUnit: (unit: BusinessUnit | null) => void;
} {
  const activeUnit = useUnitStore((s) => s.activeUnit);
  const setUnit = useUnitStore((s) => s.setUnit);
  return { activeUnit, setUnit };
}
