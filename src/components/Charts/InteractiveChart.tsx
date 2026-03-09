'use client';

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface InteractiveChartProps {
  title?: string;
  description?: string;
  children: ReactNode;
  activeFilter?: string | null;
  onFilterChange?: (filter: string | null) => void;
  filters?: Array<{ key: string; label: string; color: string }>;
  className?: string;
}

export function InteractiveChart({
  title,
  description,
  children,
  activeFilter,
  onFilterChange,
  filters,
  className,
}: InteractiveChartProps): JSX.Element {
  const [internalFilter, setInternalFilter] = useState<string | null>(null);
  const current = activeFilter !== undefined ? activeFilter : internalFilter;
  const setFilter = onFilterChange ?? setInternalFilter;

  return (
    <motion.div
      className={cn(
        'rounded-[var(--unit-border-radius)] border-2 bg-[var(--unit-surface-elevated)] p-5',
        className
      )}
      style={{ borderColor: 'var(--unit-border)', boxShadow: 'var(--unit-shadow)' }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="font-heading text-base font-semibold text-[var(--unit-text)]">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-0.5 text-sm text-[var(--unit-text)]/70">{description}</p>
          )}
        </div>
      )}

      {filters && filters.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter(null)}
            className={cn(
              'rounded-[var(--unit-radius-sm)] px-3 py-1 text-xs font-medium transition-colors',
              current === null
                ? 'bg-[var(--unit-accent)] text-white'
                : 'bg-[var(--unit-primary)]/20 text-[var(--unit-text)]/80 hover:bg-[var(--unit-primary)]/30'
            )}
          >
            Todos
          </button>
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(current === f.key ? null : f.key)}
              className={cn(
                'rounded-[var(--unit-radius-sm)] px-3 py-1 text-xs font-medium transition-colors',
                current === f.key
                  ? 'text-white'
                  : 'bg-[var(--unit-primary)]/20 text-[var(--unit-text)]/80 hover:bg-[var(--unit-primary)]/30'
              )}
              style={current === f.key ? { backgroundColor: f.color } : undefined}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={current ?? 'all'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}