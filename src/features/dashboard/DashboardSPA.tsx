'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { KPICard, Skeleton } from '@/components/ui';
import { InteractiveChart } from '@/components/Charts/InteractiveChart';
import { 
  UnitKpis, 
  SalesTrendItem, 
  TopServiceItem, 
  ProductivityItem, 
  FunnelItem, 
  CashFlowItem, 
  CriticalInventoryItem 
} from './types';
import { DollarSign, Calendar, Users, Package, AlertTriangle } from 'lucide-react';

const ChartSkeleton = () => <Skeleton className="h-[260px] w-full" />;

const LazyBarChart = dynamic(
  () => import('@/components/Charts/BarChart').then((mod) => mod.BarChart),
  { ssr: false, loading: ChartSkeleton }
);

export function DashboardSPA(): JSX.Element {
  const { data: kpis, isLoading, error: kpisError } = useQuery({
    queryKey: ['dashboard', 'kpis', 'SPA'],
    queryFn: async (): Promise<UnitKpis> => {
      const { data } = await api.get<UnitKpis>('/api/dashboard/kpis?unit=SPA');
      return data;
    },
    staleTime: 30 * 1000,
    retry: 3,
    refetchOnWindowFocus: false,
  });

  const { data: salesTrend, error: salesTrendError } = useQuery({
    queryKey: ['dashboard', 'sales-trend', 'SPA'],
    queryFn: async (): Promise<{ data: SalesTrendItem[] }> => {
      const { data } = await api.get<{ data: SalesTrendItem[] }>('/api/dashboard/sales-trend?unit=SPA&days=7');
      return data;
    },
    staleTime: 30 * 1000,
    retry: 3,
    refetchOnWindowFocus: false,
  });

  const { data: topServices, error: topServicesError } = useQuery({
    queryKey: ['dashboard', 'top-services', 'SPA'],
    queryFn: async (): Promise<{ data: TopServiceItem[] }> => {
      const { data } = await api.get<{ data: TopServiceItem[] }>('/api/dashboard/top-services?unit=SPA&limit=10');
      return data;
    },
    staleTime: 30 * 1000,
    retry: 3,
    refetchOnWindowFocus: false,
  });

  const { data: productivity, error: productivityError } = useQuery({
    queryKey: ['dashboard', 'productivity', 'SPA'],
    queryFn: async (): Promise<{ data: ProductivityItem[] }> => {
      const { data } = await api.get<{ data: ProductivityItem[] }>('/api/dashboard/productivity?unit=SPA&range=week');
      return data;
    },
    staleTime: 30 * 1000,
    retry: 3,
    refetchOnWindowFocus: false,
  });

  const { data: funnel, error: funnelError } = useQuery({
    queryKey: ['dashboard', 'appointments-funnel', 'SPA'],
    queryFn: async (): Promise<{ data: FunnelItem[] }> => {
      const { data } = await api.get<{ data: FunnelItem[] }>('/api/dashboard/appointments-funnel?unit=SPA&days=7');
      return data;
    },
    staleTime: 30 * 1000,
    retry: 3,
    refetchOnWindowFocus: false,
  });

  const { data: cashFlow, error: cashFlowError } = useQuery({
    queryKey: ['dashboard', 'cash-flow', 'SPA'],
    queryFn: async (): Promise<{ data: CashFlowItem[] }> => {
      const { data } = await api.get<{ data: CashFlowItem[] }>('/api/dashboard/cash-flow?unit=SPA&days=7');
      return data;
    },
    staleTime: 30 * 1000,
    retry: 3,
    refetchOnWindowFocus: false,
  });

  const { data: inventoryCritical, error: inventoryError } = useQuery({
    queryKey: ['dashboard', 'inventory-critical', 'SPA'],
    queryFn: async (): Promise<{ data: CriticalInventoryItem[] }> => {
      const { data } = await api.get<{ data: CriticalInventoryItem[] }>('/api/dashboard/inventory-critical?unit=SPA');
      return data;
    },
    staleTime: 30 * 1000,
    retry: 3,
    refetchOnWindowFocus: false,
  });

  // Manejo de errores
  React.useEffect(() => {
    const errors = [kpisError, salesTrendError, topServicesError, productivityError, funnelError, cashFlowError, inventoryError];
    const hasError = errors.some(error => error);
    if (hasError) {
      console.error('Errores en DashboardSPA:', { kpisError, salesTrendError, topServicesError, productivityError, funnelError, cashFlowError, inventoryError });
    }
  }, [kpisError, salesTrendError, topServicesError, productivityError, funnelError, cashFlowError, inventoryError]);

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <section aria-label="Indicadores SPA">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[140px] w-full rounded-[var(--unit-border-radius)]" />
            ))}
          </div>
        ) : kpis ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 transition-all duration-300">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-green-200/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <KPICard
                title="Ventas"
                value={kpis?.salesToday?.total ?? 0}
                subtitle={`${kpis?.salesToday?.count ?? 0} ventas`}
                description="Ingresos totales del día"
                href="/reports/sales"
                color="green"
                unit="S/"
                icon={<DollarSign className="h-6 w-6 text-white" />}
              />
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-blue-200/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <KPICard
                title="Citas"
                value={kpis?.appointmentsToday ?? 0}
                subtitle={`${kpis?.appointmentsTodayCompleted ?? 0} de ${kpis?.appointmentsToday ?? 0} completadas`}
                description="Citas programadas hoy"
                href="/appointments"
                color="blue"
                icon={<Calendar className="h-6 w-6 text-white" />}
              />
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-purple-200/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <KPICard
                title="Pendientes"
                value={kpis?.pendingSales?.count ?? 0}
                subtitle={`S/ ${(kpis?.pendingSales?.total ?? 0).toFixed(2)} en espera`}
                description="Ventas sin liquidar"
                href="/pos"
                color="purple"
                icon={<Users className="h-6 w-6 text-white" />}
              />
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-red-100/50 to-red-200/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <KPICard
                title="Stock Bajo"
                value={kpis?.lowStockCount ?? 0}
                subtitle={kpis?.lowStockCount > 0 ? kpis?.lowStockProducts?.[0]?.name ?? 'Revisar inventario' : 'Todo OK'}
                description="Productos con bajo stock"
                href="/inventory/products"
                critical={(kpis?.lowStockCount ?? 0) > 0}
                color="red"
                icon={<Package className="h-6 w-6 text-white" />}
              />
            </div>
          </div>
        ) : null}
      </section>

      {/* Existing charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InteractiveChart title="Ventas últimos 7 días" description="Ingresos diarios SPA">
          {salesTrend?.data ? (
            <LazyBarChart
              data={salesTrend.data.map(d => ({ ...d, name: d.date, ventas: d.totalSales }))}
              series={[{ dataKey: 'ventas', color: '#8B0000', label: 'Ventas (S/)' }]}
              height={260}
            />
          ) : (
            <Skeleton className="h-[260px] w-full" />
          )}
        </InteractiveChart>

        <InteractiveChart title="Servicios más solicitados" description="Top servicios SPA">
          {topServices?.data ? (
            <LazyBarChart
              data={topServices.data.map(s => ({ ...s, name: s.serviceName, cantidad: s.count }))}
              series={[{ dataKey: 'cantidad', color: '#B8860B', label: 'Cantidad' }]}
              height={260}
            />
          ) : (
            <Skeleton className="h-[260px] w-full" />
          )}
        </InteractiveChart>
      </div>

      {/* New charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InteractiveChart title="Tendencia de ventas y ticket promedio" description="Últimos 7 días">
          {salesTrend?.data ? (
            <LazyBarChart
              data={salesTrend.data.map(d => ({ ...d, name: d.date }))}
              series={[
                { dataKey: 'totalSales', color: '#2563eb', label: 'Ventas (S/)' },
                { dataKey: 'ticketAvg', color: '#dc2626', label: 'Ticket promedio (S/)' },
              ]}
              height={260}
            />
          ) : (
            <Skeleton className="h-[260px] w-full" />
          )}
        </InteractiveChart>

        <InteractiveChart title="Servicios más rentables" description="Top 10 por ingresos">
          {topServices?.data ? (
            <LazyBarChart
              data={topServices.data.map(s => ({ ...s, name: s.serviceName }))}
              series={[
                { dataKey: 'revenue', color: '#16a34a', label: 'Ingresos (S/)' },
                { dataKey: 'count', color: '#9333ea', label: 'Cantidad' },
              ]}
              height={260}
            />
          ) : (
            <Skeleton className="h-[260px] w-full" />
          )}
        </InteractiveChart>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InteractiveChart title="Productividad por empleado" description="Servicios y ticket promedio">
          {productivity?.data ? (
            <LazyBarChart
              data={productivity.data.map(p => ({ ...p, name: p.employee }))}
              series={[
                { dataKey: 'servicesCount', color: '#0891b2', label: 'Servicios' },
                { dataKey: 'avgTicket', color: '#f59e0b', label: 'Ticket promedio (S/)' },
              ]}
              height={260}
            />
          ) : (
            <Skeleton className="h-[260px] w-full" />
          )}
        </InteractiveChart>

        <InteractiveChart title="Embudo de agenda" description="Estado de citas últimos 7 días">
          {funnel?.data ? (
            <LazyBarChart
              data={funnel.data.map(f => ({ ...f, name: f.stage }))}
              series={[{ dataKey: 'count', color: '#0d9488', label: 'Cantidad' }]}
              height={260}
            />
          ) : (
            <Skeleton className="h-[260px] w-full" />
          )}
        </InteractiveChart>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InteractiveChart title="Flujo de caja" description="Ingresos vs egresos últimos 7 días">
          {cashFlow?.data ? (
            <LazyBarChart
              data={cashFlow.data.map(c => ({ ...c, name: c.date }))}
              series={[
                { dataKey: 'income', color: '#059669', label: 'Ingresos (S/)' },
                { dataKey: 'expenses', color: '#dc2626', label: 'Egresos (S/)' },
              ]}
              height={260}
            />
          ) : (
            <Skeleton className="h-[260px] w-full" />
          )}
        </InteractiveChart>

        <InteractiveChart title="Inventario crítico por categoría" description="Productos con stock bajo">
          {inventoryCritical?.data ? (
            <LazyBarChart
              data={inventoryCritical.data.map(cat => ({ name: cat.category, count: cat.products.length }))}
              series={[{ dataKey: 'count', color: '#7c3aed', label: 'Productos críticos' }]}
              height={260}
            />
          ) : (
            <Skeleton className="h-[260px] w-full" />
          )}
        </InteractiveChart>
      </div>
    </div>
  );
}
