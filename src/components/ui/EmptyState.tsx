'use client';

import { type ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps): JSX.Element {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[var(--unit-border-radius)] border border-dashed border-[var(--unit-primary)]/40 bg-[var(--unit-secondary)]/30 px-8 py-12 text-center',
        className
      )}
    >
      <div className="mb-4 text-[var(--unit-text)]/50">
        {icon ?? <Inbox className="mx-auto h-12 w-12" aria-hidden />}
      </div>
      <h3 className="font-heading text-lg font-semibold text-[var(--unit-text)]">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-[var(--unit-text)]/80">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
