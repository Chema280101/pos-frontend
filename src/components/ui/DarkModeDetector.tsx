'use client';

import { useDarkMode } from './DarkModeProvider';

interface DarkModeDetectorProps {
  children: (props: { isDark: boolean }) => React.ReactNode;
}

export function DarkModeDetector({ children }: DarkModeDetectorProps): JSX.Element {
  const { isDark } = useDarkMode();
  return <>{children({ isDark })}</>;
}
