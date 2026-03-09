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
            <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm shadow-lg h-8 w-64">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 opacity-50"></div>
              <div className="h-full w-full bg-gradient-to-r from-[var(--unit-surface)]/50 to-[var(--unit-surface-elevated)]/50 animate-pulse"></div>
            </div>
            <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm shadow-lg h-10 w-32">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-50"></div>
              <div className="h-full w-full bg-gradient-to-r from-[var(--unit-surface)]/50 to-[var(--unit-surface-elevated)]/50 animate-pulse"></div>
            </div>
          </div>

          {/* Skeleton Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm shadow-lg h-32">
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-30"></div>
                <div className="relative p-4 space-y-3">
                  <div className="h-4 w-16 rounded-xl bg-gradient-to-r from-[var(--unit-surface)]/50 to-[var(--unit-surface-elevated)]/50 animate-pulse"></div>
                  <div className="h-8 w-20 rounded-xl bg-gradient-to-r from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 animate-pulse"></div>
                  <div className="h-3 w-full rounded-lg bg-gradient-to-r from-[var(--unit-surface)]/30 to-[var(--unit-surface-elevated)]/30 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Skeleton Main Content */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm shadow-lg h-96">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-20"></div>
            <div className="relative p-6 space-y-4">
              {/* Table Header Skeleton */}
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <div className="h-10 w-48 rounded-xl bg-gradient-to-r from-[var(--unit-surface)]/50 to-[var(--unit-surface-elevated)]/50 animate-pulse"></div>
                  <div className="h-10 w-32 rounded-xl bg-gradient-to-r from-[var(--unit-surface)]/50 to-[var(--unit-surface-elevated)]/50 animate-pulse"></div>
                </div>
                <div className="h-10 w-24 rounded-xl bg-gradient-to-r from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 animate-pulse"></div>
              </div>

              {/* Table Rows Skeleton */}
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-[var(--unit-border)]/20">
                    <div className="h-4 w-24 rounded-lg bg-gradient-to-r from-[var(--unit-surface)]/40 to-[var(--unit-surface-elevated)]/40 animate-pulse"></div>
                    <div className="h-4 w-32 rounded-lg bg-gradient-to-r from-[var(--unit-surface)]/40 to-[var(--unit-surface-elevated)]/40 animate-pulse"></div>
                    <div className="h-4 w-20 rounded-lg bg-gradient-to-r from-[var(--unit-surface)]/40 to-[var(--unit-surface-elevated)]/40 animate-pulse"></div>
                    <div className="h-4 w-16 rounded-lg bg-gradient-to-r from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
