'use client';

import { cn } from '@/lib/utils';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

const variantStyles: Record<'text' | 'circular' | 'rectangular' | 'rounded', string> = {
  text: 'h-4 rounded',
  circular: 'rounded-full',
  rectangular: 'rounded-none',
  rounded: 'rounded-lg',
};

export function Skeleton({ 
  className, 
  variant = 'text', 
  width, 
  height, 
  lines = 1 
}: SkeletonProps): JSX.Element {
  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'rounded-[var(--unit-border-radius)] bg-[var(--unit-primary)]/30',
              'animate-shimmer bg-[length:200%_100%]',
              'bg-[linear-gradient(90deg,var(--unit-primary)_0%,rgba(255,255,255,0.25)_50%,var(--unit-primary)_100%)]',
              variantStyles[variant],
              i === lines - 1 ? 'w-3/4' : 'w-full'
            )}
            style={{
              width: i === lines - 1 && typeof width === 'number' ? `${width * 0.75}px` : width,
              height,
            }}
            aria-hidden
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-[var(--unit-border-radius)] bg-[var(--unit-primary)]/30',
        'animate-shimmer bg-[length:200%_100%]',
        'bg-[linear-gradient(90deg,var(--unit-primary)_0%,rgba(255,255,255,0.25)_50%,var(--unit-primary)_100%)]',
        variantStyles[variant],
        className
      )}
      style={{ width, height }}
      aria-hidden
    />
  );
}

export function SkeletonLoader(): JSX.Element {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton width="75%" />
          <Skeleton width="50%" />
        </div>
      </div>
      <Skeleton height={128} />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton height={80} />
        <Skeleton height={80} />
        <Skeleton height={80} />
      </div>
      <Skeleton height={256} />
    </div>
  );
}

// Componentes específicos para casos comunes
export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <div className="space-y-4 p-4">
    {/* Header skeleton */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={`header-${i}`} height="20px" />
      ))}
    </div>
    
    {/* Row skeletons */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={`cell-${rowIndex}-${colIndex}`} height="16px" />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton = ({ showAvatar = true }: { showAvatar?: boolean }) => (
  <div className="p-6 border border-[var(--unit-border)]/30 rounded-xl bg-[var(--unit-surface)]">
    {showAvatar && (
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1">
          <Skeleton width="60%" />
          <Skeleton width="40%" className="mt-1" />
        </div>
      </div>
    )}
    <div className="space-y-3">
      <Skeleton lines={2} />
      <Skeleton width="80%" />
    </div>
  </div>
);

export const FormSkeleton = ({ fields = 4 }: { fields?: number }) => (
  <div className="space-y-6 p-4">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton width="30%" height="16px" />
        <Skeleton variant="rounded" height="44px" />
      </div>
    ))}
    <div className="flex gap-4 pt-4">
      <Skeleton variant="rounded" width={120} height="44px" />
      <Skeleton variant="rounded" width={80} height="44px" />
    </div>
  </div>
);
