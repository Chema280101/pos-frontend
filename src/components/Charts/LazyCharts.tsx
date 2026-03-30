'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui';

// Lazy loading para componentes de Recharts - ~800KB → 0KB en carga inicial
// PERFORMANCE: Reducir bundle inicial y mejorar tiempo de carga

// Lazy loading para BarChart
export const LazyBarChart = dynamic(() => 
  import('./BarChart').then(mod => ({ 
    default: mod.BarChart 
  })), {
  loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-lg" />,
  ssr: false
});

// Lazy loading para LineChart
export const LazyLineChart = dynamic(() => 
  import('./LineChart').then(mod => ({ 
    default: mod.LineChart 
  })), {
  loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-lg" />,
  ssr: false
});

// Lazy loading para PieChart
export const LazyPieChart = dynamic(() => 
  import('./PieChart').then(mod => ({ 
    default: mod.PieChart 
  })), {
  loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-lg" />,
  ssr: false
});

// Lazy loading para InteractiveChart
export const LazyInteractiveChart = dynamic(() => 
  import('./InteractiveChart').then(mod => ({ 
    default: mod.InteractiveChart 
  })), {
  loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-lg" />,
  ssr: false
});
