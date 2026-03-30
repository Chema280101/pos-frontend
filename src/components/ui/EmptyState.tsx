'use client';

import { type ReactNode } from 'react';
import { Inbox, Search, Package, Users, Calendar, DollarSign, FileText, AlertCircle, Plus, RefreshCw } from 'lucide-react';
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
        return <Search className="mx-auto h-12 w-12" aria-hidden />;
      case 'data':
        return <Package className="mx-auto h-12 w-12" aria-hidden />;
      case 'users':
        return <Users className="mx-auto h-12 w-12" aria-hidden />;
      case 'calendar':
        return <Calendar className="mx-auto h-12 w-12" aria-hidden />;
      case 'money':
        return <DollarSign className="mx-auto h-12 w-12" aria-hidden />;
      case 'reports':
        return <FileText className="mx-auto h-12 w-12" aria-hidden />;
      case 'error':
        return <AlertCircle className="mx-auto h-12 w-12" aria-hidden />;
      default:
        return <Inbox className="mx-auto h-12 w-12" aria-hidden />;
    }
  };

  // Colores por variante
  const getVariantColors = (): string => {
    switch (variant) {
      case 'search':
        return 'text-blue-500/50 border-blue-200/50 bg-blue-50/30';
      case 'data':
        return 'text-purple-500/50 border-purple-200/50 bg-purple-50/30';
      case 'users':
        return 'text-pink-500/50 border-pink-200/50 bg-pink-50/30';
      case 'calendar':
        return 'text-green-500/50 border-green-200/50 bg-green-50/30';
      case 'money':
        return 'text-emerald-500/50 border-emerald-200/50 bg-emerald-50/30';
      case 'reports':
        return 'text-orange-500/50 border-orange-200/50 bg-orange-50/30';
      case 'error':
        return 'text-red-500/50 border-red-200/50 bg-red-50/30';
      default:
        return 'text-[var(--unit-text)]/50 border-[var(--unit-primary)]/40 bg-[var(--unit-secondary)]/30';
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[var(--unit-border-radius)] border border-dashed px-8 py-12 text-center',
        getVariantColors(),
        className
      )}
    >
      <div className="mb-4">
        {icon ?? getVariantIcon()}
      </div>
      <h3 className="font-heading text-lg font-semibold text-[var(--unit-text)]">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-[var(--unit-text)]/80">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
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
