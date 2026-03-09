'use client';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

/**
 * Banner persistente en la parte superior cuando no hay conexión.
 * Oculto cuando está online.
 */
export function OfflineBanner(): JSX.Element {
  const online = useOnlineStatus();

  if (online) return <></>;

  return (
    <div
      className="flex items-center justify-center gap-2 bg-amber-600 px-4 py-2 text-sm font-medium text-white"
      role="alert"
      aria-live="polite"
    >
      <WifiOff className="h-5 w-5 shrink-0" aria-hidden />
      <span>Sin conexión. Los cambios se guardarán cuando vuelvas a estar online.</span>
    </div>
  );
}
