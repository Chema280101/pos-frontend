import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BusinessUnit } from '@/lib/theme';

interface UnitState {
  activeUnit: BusinessUnit | null;
  setUnit: (unit: BusinessUnit | null) => void;
}

export const useUnitStore = create<UnitState>()(
  persist(
    (set) => ({
      activeUnit: null,
      setUnit: (unit) => {
        set({ activeUnit: unit });
      },
    }),
    { name: 'unit-storage' }
  )
);