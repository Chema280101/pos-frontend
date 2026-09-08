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
  default: 'border border-[var(--unit-border)]/30 bg-[var(--unit-surface-elevated)] text-[var(--unit-text)]',
  success: 'border border-[var(--unit-success)]/30 bg-[var(--unit-success)]/10 text-[var(--unit-success)]',
  warning: 'border border-[var(--unit-warning)]/30 bg-[var(--unit-warning)]/10 text-[var(--unit-warning)]',
  danger: 'border border-[var(--unit-error)]/30 bg-[var(--unit-error)]/10 text-[var(--unit-error)]',
  info: 'border border-[var(--unit-primary)]/30 bg-[var(--unit-primary)]/10 text-[var(--unit-primary)]',
};

export function Badge({ children, variant = 'default', className }: BadgeProps): JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-unit border px-3 py-1.5 text-xs font-bold transition-all duration-200',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
