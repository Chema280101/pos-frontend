'use client';

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui';

interface LazyReportPageProps {
  children: React.ReactNode;
}

export function LazyReportPage({ children }: LazyReportPageProps): JSX.Element {
  return (
    <Suspense 
      fallback={
        <div className="space-y-6 p-6">
          {/* Skeleton Header */}
          <div className="flex items-center justify-between">
            <div className="rounded-unit-lg border border-[var(--unit-border)]/30 bg-[var(--unit-surface-elevated)] h-8 w-64 animate-pulse"></div>
            <div className="rounded-unit border border-[var(--unit-border)]/30 bg-[var(--unit-surface-elevated)] h-10 w-32 animate-pulse"></div>
          </div>

          {/* Skeleton Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-unit-lg border border-[var(--unit-border)]/30 bg-[var(--unit-surface)] p-4 space-y-3 shadow-sm">
                <div className="h-4 w-16 rounded-unit bg-[var(--unit-surface-elevated)] animate-pulse"></div>
                <div className="h-8 w-20 rounded-unit bg-[var(--unit-accent)]/15 animate-pulse"></div>
                <div className="h-3 w-full rounded-lg bg-[var(--unit-surface-elevated)] animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Skeleton Main Content */}
          <div className="rounded-unit-lg border border-[var(--unit-border)]/30 bg-[var(--unit-surface)] shadow-sm p-6 space-y-4">
            {/* Table Header Skeleton */}
            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <div className="h-10 w-48 rounded-unit bg-[var(--unit-surface-elevated)] animate-pulse"></div>
                <div className="h-10 w-32 rounded-unit bg-[var(--unit-surface-elevated)] animate-pulse"></div>
              </div>
              <div className="h-10 w-24 rounded-unit bg-[var(--unit-accent)]/15 animate-pulse"></div>
            </div>

            {/* Table Rows Skeleton */}
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-unit border border-[var(--unit-border)]/20 bg-[var(--unit-surface-elevated)]/40">
                  <div className="h-4 w-24 rounded-lg bg-[var(--unit-surface-elevated)] animate-pulse"></div>
                  <div className="h-4 w-32 rounded-lg bg-[var(--unit-surface-elevated)] animate-pulse"></div>
                  <div className="h-4 w-20 rounded-lg bg-[var(--unit-surface-elevated)] animate-pulse"></div>
                  <div className="h-4 w-16 rounded-lg bg-[var(--unit-accent)]/15 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
