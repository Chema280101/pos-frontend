'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] text-[var(--unit-text)] shadow-[var(--unit-shadow)] hover:shadow-lg',
  success: 'border-2 border-green-500/50 bg-gradient-to-br from-green-500/10 to-green-600/10 text-green-700 shadow-green-500/20 hover:shadow-green-500/30',
  warning: 'border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-amber-600/10 text-amber-700 shadow-amber-500/20 hover:shadow-amber-500/30',
  danger: 'border-2 border-red-500/50 bg-gradient-to-br from-red-500/10 to-red-600/10 text-red-700 shadow-red-500/20 hover:shadow-red-500/30',
  info: 'border-2 border-blue-500/50 bg-gradient-to-br from-blue-500/10 to-blue-600/10 text-blue-700 shadow-blue-500/20 hover:shadow-blue-500/30',
};

export function Badge({ children, variant = 'default', className }: BadgeProps): JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-xl border px-3 py-1.5 text-xs font-bold backdrop-blur-sm transition-all duration-200 hover:scale-105 group',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
