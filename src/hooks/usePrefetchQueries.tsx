'use client';

import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useUnitStore } from '@/store/unitStore';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

/**
 * Hook para prefetch inteligente de queries basado en navegación y rol
 * Optimiza la primera carga de páginas eliminando el fetch bloqueante
 */
type PrefetchRoute = (route: string) => void;

export function usePrefetchQueries(): PrefetchRoute {
  const queryClient = useQueryClient();
  const router = useRouter();
  const activeUnit = useUnitStore((s) => s.activeUnit);
  const user = useAuthStore((s) => s.user);
  const unit = activeUnit ?? 'SPA';
  const userRole = user?.role ?? 'BARBER';

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
    // Solo hacer prefetch de dashboard si es ADMIN o RECEPTIONIST
    if (userRole !== 'ADMIN' && userRole !== 'RECEPTIONIST') {
      return;
    }

    queryClient.prefetchQuery({
      queryKey: ['dashboard', 'kpis', unit],
      queryFn: async () => {
        const { data } = await api.get(`/api/dashboard/kpis?unit=${unit}`);
        return data;
      },
      staleTime: 30 * 1000,
    });
  }, [queryClient, unit, userRole]);

  const prefetchClients = useCallback(() => {
    // Solo hacer prefetch de clientes si es ADMIN o RECEPTIONIST
    if (userRole !== 'ADMIN' && userRole !== 'RECEPTIONIST') {
      return;
    }

    queryClient.prefetchQuery({
      queryKey: ['clients', unit],
      queryFn: async () => {
        const { data } = await api.get(`/api/clients?unit=${unit}`);
        return data;
      },
      staleTime: 60 * 1000,
    });
  }, [queryClient, unit, userRole]);

  const prefetchCash = useCallback(() => {
    // Solo hacer prefetch de caja si es ADMIN o RECEPTIONIST
    if (userRole !== 'ADMIN' && userRole !== 'RECEPTIONIST') {
      return;
    }

    queryClient.prefetchQuery({
      queryKey: ['cash-register', unit],
      queryFn: async () => {
        const { data } = await api.get(`/api/cash-register/summary?unit=${unit}`);
        return data;
      },
      staleTime: 60 * 1000,
    });
  }, [queryClient, unit, userRole]);

  useEffect(() => {
    // Prefetch rutas según el rol
    const routesToPrefetch = [];
    
    if (userRole === 'ADMIN' || userRole === 'RECEPTIONIST') {
      routesToPrefetch.push('/dashboard', '/clients', '/cash-register');
    }
    
    // Todos los roles pueden ver appointments
    routesToPrefetch.push('/appointments');
    
    routesToPrefetch.forEach((route) => router.prefetch(route));

    // Prefetch de datos según rol
    prefetchAppointments();
    prefetchDashboard();
    prefetchClients();
    prefetchCash();
  }, [router, prefetchDashboard, prefetchAppointments, prefetchClients, prefetchCash, userRole]);

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

