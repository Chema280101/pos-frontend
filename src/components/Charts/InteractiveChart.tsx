'use client';

import React, { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface RangeOption {
  label: string;
  value: number | string;
}

export interface InteractiveChartProps {
  title?: string;
  description?: string;
  children: ReactNode;
  activeFilter?: string | null;
  onFilterChange?: (filter: string | null) => void;
  filters?: Array<{ key: string; label: string; color?: string }>;
  rangeOptions?: RangeOption[];
  selectedRange?: number | string;
  onRangeChange?: (range: any) => void;
  badge?: {
    text: string;
    variant?: 'success' | 'warning' | 'info' | 'neutral' | 'danger';
  };
  headerRight?: ReactNode;
  className?: string;
}

export function InteractiveChart({
  title,
  description,
  children,
  activeFilter,
  onFilterChange,
  filters,
  rangeOptions,
  selectedRange,
  onRangeChange,
  badge,
  headerRight,
  className,
}: InteractiveChartProps): JSX.Element {
  const [internalFilter, setInternalFilter] = useState<string | null>(null);
  const currentFilter = activeFilter !== undefined ? activeFilter : internalFilter;
  const setFilter = onFilterChange ?? setInternalFilter;

  const [internalRange, setInternalRange] = useState<number | string>(
    rangeOptions?.[0]?.value ?? 7
  );
  const currentRange = selectedRange !== undefined ? selectedRange : internalRange;
  const setRange = onRangeChange ?? setInternalRange;

  const badgeVariantStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50',
    info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50',
    neutral: 'bg-[var(--unit-surface)] text-[var(--unit-text)] border-[var(--unit-border)]',
  };

  return (
    <motion.div
      className={cn(
        'rounded-unit-lg border bg-[var(--unit-surface-elevated)] p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-slate-800/80',
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {(title || description || rangeOptions || badge || headerRight) && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              {title && (
                <h3 className="font-heading text-base font-semibold tracking-tight text-[var(--unit-text)]">
                  {title}
                </h3>
              )}
              {badge && (
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors',
                    badgeVariantStyles[badge.variant || 'neutral']
                  )}
                >
                  {badge.text}
                </span>
              )}
            </div>
            {description && (
              <p className="mt-0.5 text-xs text-[var(--unit-text-muted)]">
                {description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {headerRight}

            {/* Time Range Pills (7D / 14D / 30D / Mes) */}
            {rangeOptions && rangeOptions.length > 0 && (
              <div className="inline-flex rounded-lg bg-[var(--unit-surface)]/90 p-0.5 border border-[var(--unit-border)]/60 text-xs">
                {rangeOptions.map((opt) => {
                  const isSelected = String(currentRange) === String(opt.value);
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => setRange(opt.value)}
                      className={cn(
                        'rounded-md px-2.5 py-1 font-medium transition-all duration-200 text-xs',
                        isSelected
                          ? 'bg-[var(--unit-surface-elevated)] text-[var(--unit-text)] shadow-sm font-semibold'
                          : 'text-[var(--unit-text-muted)] hover:text-[var(--unit-text)]'
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category / Dimension Filter Pills */}
      {filters && filters.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setFilter(null)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-all duration-150',
              currentFilter === null
                ? 'bg-[var(--unit-text)] text-[var(--unit-surface)] shadow-sm'
                : 'bg-[var(--unit-surface)] text-[var(--unit-text-muted)] hover:bg-[var(--unit-surface-elevated)]'
            )}
          >
            Todos
          </button>
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(currentFilter === f.key ? null : f.key)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-all duration-150',
                currentFilter === f.key
                  ? 'bg-[var(--unit-text)] text-[var(--unit-surface)] shadow-sm'
                  : 'bg-[var(--unit-surface)] text-[var(--unit-text-muted)] hover:bg-[var(--unit-surface-elevated)]'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentFilter ?? 'all'}-${currentRange ?? 'default'}`}
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.99 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}