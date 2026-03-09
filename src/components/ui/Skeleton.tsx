'use client';

import { cn } from '@/lib/utils';

export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps): JSX.Element {
  return (
    <div
      className={cn(
        'rounded-[var(--unit-border-radius)] bg-[var(--unit-primary)]/30',
        'animate-shimmer bg-[length:200%_100%]',
        'bg-[linear-gradient(90deg,var(--unit-primary)_0%,rgba(255,255,255,0.25)_50%,var(--unit-primary)_100%)]',
        className
      )}
      aria-hidden
    />
  );
}

export function SkeletonLoader(): JSX.Element {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
