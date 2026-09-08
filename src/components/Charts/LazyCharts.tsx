'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const ChartSkeleton = () => (
  <div className="h-[280px] w-full animate-pulse rounded-unit bg-[var(--unit-surface)]/60" />
);

// Lazy loading para componentes de Recharts
// PERFORMANCE: Reducir bundle inicial y code splitting óptimo

export const LazyBarChart = dynamic(
  () => import('./BarChart').then((mod) => ({ default: mod.BarChart })),
  { loading: ChartSkeleton, ssr: false }
);

export const LazyLineChart = dynamic(
  () => import('./LineChart').then((mod) => ({ default: mod.LineChart })),
  { loading: ChartSkeleton, ssr: false }
);

export const LazyAreaChart = dynamic(
  () => import('./AreaChart').then((mod) => ({ default: mod.AreaChart })),
  { loading: ChartSkeleton, ssr: false }
);

export const LazyHorizontalBarChart = dynamic(
  () => import('./HorizontalBarChart').then((mod) => ({ default: mod.HorizontalBarChart })),
  { loading: ChartSkeleton, ssr: false }
);

export const LazyComposedDoubleAxisChart = dynamic(
  () => import('./ComposedDoubleAxisChart').then((mod) => ({ default: mod.ComposedDoubleAxisChart })),
  { loading: ChartSkeleton, ssr: false }
);

export const LazyDonutChart = dynamic(
  () => import('./DonutChart').then((mod) => ({ default: mod.DonutChart })),
  { loading: ChartSkeleton, ssr: false }
);

export const LazyFunnelChart = dynamic(
  () => import('./FunnelChart').then((mod) => ({ default: mod.FunnelChart })),
  { loading: ChartSkeleton, ssr: false }
);

export const LazyPieChart = dynamic(
  () => import('./PieChart').then((mod) => ({ default: mod.PieChart })),
  { loading: ChartSkeleton, ssr: false }
);

export const LazyInteractiveChart = dynamic(
  () => import('./InteractiveChart').then((mod) => ({ default: mod.InteractiveChart })),
  { loading: ChartSkeleton, ssr: false }
);
