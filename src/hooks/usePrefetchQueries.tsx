'use client';

import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useUnitStore } from '@/store/unitStore';
import { api } from '@/lib/api';

/**
 * Hook para prefetch inteligente de queries basado en navegación
 * Optimiza la primera carga de páginas eliminando el fetch bloqueante
 */
type PrefetchRoute = (route: string) => void;

export function usePrefetchQueries(): PrefetchRoute {
  const queryClient = useQueryClient();
  const router = useRouter();
  const activeUnit = useUnitStore((s) => s.activeUnit);
  const unit = activeUnit ?? 'SPA';

  const prefetchAppointments = useCallback(() => {
    const viewStart = new Date();
    viewStart.setHours(0, 0, 0, 0);
    const viewEnd = new Date();
    viewEnd.setHours(23, 59, 59, 999);

    queryClient.prefetchQuery({
      queryKey: ['appointments', unit, viewStart.toISOString(), viewEnd.toISOString()],
      queryFn: async () => {
        const params = new URLSearchParams({
          unit,
          from: viewStart.toISOString(),
          to: viewEnd.toISOString(),
        });
        const { data } = await api.get(`/api/appointments?${params}`);
        return data;
      },
      staleTime: 30 * 1000,
    });
  }, [queryClient, unit]);

  const prefetchDashboard = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['dashboard', 'kpis', unit],
      queryFn: async () => {
        const { data } = await api.get(`/api/dashboard/kpis?unit=${unit}`);
        return data;
      },
      staleTime: 30 * 1000,
    });
  }, [queryClient, unit]);

  const prefetchClients = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['clients', unit],
      queryFn: async () => {
        const { data } = await api.get(`/api/clients?unit=${unit}`);
        return data;
      },
      staleTime: 60 * 1000,
    });
  }, [queryClient, unit]);

  const prefetchCash = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['cash-register', unit],
      queryFn: async () => {
        const { data } = await api.get(`/api/cash-register/summary?unit=${unit}`);
        return data;
      },
      staleTime: 60 * 1000,
    });
  }, [queryClient, unit]);

  useEffect(() => {
    const routesToPrefetch = ['/dashboard', '/appointments', '/clients', '/cash-register'];
    routesToPrefetch.forEach((route) => router.prefetch(route));

    prefetchDashboard();
    prefetchAppointments();
    prefetchClients();
  }, [router, prefetchDashboard, prefetchAppointments, prefetchClients]);

  const prefetchRoute = useCallback<PrefetchRoute>((route) => {
    if (!route) return;

    if (route.startsWith('/appointments')) {
      prefetchAppointments();
    } else if (route.startsWith('/dashboard')) {
      prefetchDashboard();
    } else if (route.startsWith('/clients')) {
      prefetchClients();
    } else if (route.startsWith('/cash') || route.startsWith('/expenses') || route.startsWith('/income')) {
      prefetchCash();
    }

    router.prefetch(route);
  }, [prefetchAppointments, prefetchDashboard, prefetchClients, prefetchCash, router]);

  return prefetchRoute;
}

