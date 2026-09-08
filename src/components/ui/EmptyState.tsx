'use client';

import { type ReactNode } from 'react';
import { Inbox, Search, Package, Users, Calendar, DollarSign, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  variant?: 'default' | 'search' | 'data' | 'users' | 'calendar' | 'money' | 'reports' | 'error';
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  variant = 'default',
}: EmptyStateProps): JSX.Element {
  // Iconos por variante
  const getVariantIcon = (): ReactNode => {
    switch (variant) {
      case 'search':
        return <Search className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden />;
      case 'data':
        return <Package className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden />;
      case 'users':
        return <Users className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden />;
      case 'calendar':
        return <Calendar className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden />;
      case 'money':
        return <DollarSign className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden />;
      case 'reports':
        return <FileText className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden />;
      case 'error':
        return <AlertCircle className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden />;
      default:
        return <Inbox className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden />;
    }
  };

  // Estilos de badge por variante
  const getVariantBadgeStyles = (): string => {
    switch (variant) {
      case 'search':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400';
      case 'data':
        return 'bg-[var(--unit-accent)]/10 border-[var(--unit-accent)]/20 text-[var(--unit-accent)]';
      case 'users':
        return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400';
      case 'calendar':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400';
      case 'money':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400';
      case 'reports':
        return 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400';
      case 'error':
        return 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400';
      default:
        return 'bg-[var(--unit-accent)]/10 border-[var(--unit-accent)]/20 text-[var(--unit-accent)]';
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-unit-lg border border-dashed border-[var(--unit-border)] bg-[var(--unit-surface-elevated)]/40 p-8 sm:p-12 text-center transition-colors',
        className
      )}
    >
      <div
        className={cn(
          'mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-unit border shadow-unit transition-transform duration-200 hover:scale-105',
          getVariantBadgeStyles()
        )}
      >
        {icon ?? getVariantIcon()}
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-[var(--unit-text)] tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-md text-sm text-[var(--unit-text-muted)] leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

// Componentes de conveniencia para casos comunes
export function EmptyStateSearch(props: Omit<EmptyStateProps, 'variant'>) {
  return <EmptyState {...props} variant="search" />;
}

export function EmptyStateData(props: Omit<EmptyStateProps, 'variant'>) {
  return <EmptyState {...props} variant="data" />;
}

export function EmptyStateUsers(props: Omit<EmptyStateProps, 'variant'>) {
  return <EmptyState {...props} variant="users" />;
}

export function EmptyStateCalendar(props: Omit<EmptyStateProps, 'variant'>) {
  return <EmptyState {...props} variant="calendar" />;
}

export function EmptyStateMoney(props: Omit<EmptyStateProps, 'variant'>) {
  return <EmptyState {...props} variant="money" />;
}

export function EmptyStateReports(props: Omit<EmptyStateProps, 'variant'>) {
  return <EmptyState {...props} variant="reports" />;
}

export function EmptyStateError(props: Omit<EmptyStateProps, 'variant'>) {
  return <EmptyState {...props} variant="error" />;
}

