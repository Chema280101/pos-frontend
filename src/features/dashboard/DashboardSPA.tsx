'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { KPICard, Skeleton } from '@/components/ui';
import {
  LazyAreaChart,
  LazyHorizontalBarChart,
  LazyComposedDoubleAxisChart,
  LazyFunnelChart,
  LazyBarChart,
  LazyInteractiveChart,
} from '@/components/Charts/LazyCharts';
import {
  UnitKpis,
  SalesTrendItem,
  TopServiceItem,
  ProductivityItem,
  FunnelItem,
  CashFlowItem,
  CriticalInventoryItem,
} from './types';
import { DollarSign, Calendar, Users, Package } from 'lucide-react';

export function DashboardSPA(): JSX.Element {
  const [salesTrendDays, setSalesTrendDays] = useState<number>(7);
  const [productivityRange, setProductivityRange] = useState<string>('week');
  const [cashFlowDays, setCashFlowDays] = useState<number>(7);

  const { data: kpis, isLoading } = useQuery({
    queryKey: ['dashboard', 'kpis', 'SPA'],
    queryFn: async (): Promise<UnitKpis> => {
      const { data } = await api.get<UnitKpis>('/api/kpi/direct?unit=SPA');
      return data;
    },
    staleTime: 0,
  });

  const { data: salesTrend, isLoading: loadingSalesTrend } = useQuery({
    queryKey: ['dashboard', 'sales-trend', 'SPA', salesTrendDays],
    queryFn: async (): Promise<{ data: SalesTrendItem[] }> => {
      const { data } = await api.get<{ data: SalesTrendItem[] }>(
        `/api/dashboard/sales-trend?unit=SPA&days=${salesTrendDays}`
      );
      return data;
    },
    staleTime: 30 * 1000,
  });

  const { data: topServices, isLoading: loadingTopServices } = useQuery({
    queryKey: ['dashboard', 'top-services', 'SPA'],
    queryFn: async (): Promise<{ data: TopServiceItem[] }> => {
      const { data } = await api.get<{ data: TopServiceItem[] }>(
        '/api/dashboard/top-services?unit=SPA&limit=6'
      );
      return data;
    },
    staleTime: 30 * 1000,
  });

  const { data: productivity, isLoading: loadingProductivity } = useQuery({
    queryKey: ['dashboard', 'productivity', 'SPA', productivityRange],
    queryFn: async (): Promise<{ data: ProductivityItem[] }> => {
      const { data } = await api.get<{ data: ProductivityItem[] }>(
        `/api/dashboard/productivity?unit=SPA&range=${productivityRange}`
      );
      return data;
    },
    staleTime: 30 * 1000,
  });

  const { data: funnel, isLoading: loadingFunnel } = useQuery({
    queryKey: ['dashboard', 'appointments-funnel', 'SPA'],
    queryFn: async (): Promise<{ data: FunnelItem[] }> => {
      const { data } = await api.get<{ data: FunnelItem[] }>(
        '/api/dashboard/appointments-funnel?unit=SPA&days=7'
      );
      return data;
    },
    staleTime: 30 * 1000,
  });

  const { data: cashFlow, isLoading: loadingCashFlow } = useQuery({
    queryKey: ['dashboard', 'cash-flow', 'SPA', cashFlowDays],
    queryFn: async (): Promise<{ data: CashFlowItem[] }> => {
      const { data } = await api.get<{ data: CashFlowItem[] }>(
        `/api/dashboard/cash-flow?unit=SPA&days=${cashFlowDays}`
      );
      return data;
    },
    staleTime: 30 * 1000,
  });

  const { data: inventoryCritical, isLoading: loadingInventory } = useQuery({
    queryKey: ['dashboard', 'inventory-critical', 'SPA'],
    queryFn: async (): Promise<{ data: CriticalInventoryItem[] }> => {
      const { data } = await api.get<{ data: CriticalInventoryItem[] }>(
        '/api/dashboard/inventory-critical?unit=SPA'
      );
      return data;
    },
    staleTime: 30 * 1000,
  });

  // Calculate totals for badges
  const totalSalesInRange = salesTrend?.data?.reduce((sum, item) => sum + item.ventas, 0) ?? 0;
  const totalCashIncome = cashFlow?.data?.reduce((sum, item) => sum + item.income, 0) ?? 0;
  const totalCashExpenses = cashFlow?.data?.reduce((sum, item) => sum + (item.expenses || 0), 0) ?? 0;
  const netCashBalance = totalCashIncome - totalCashExpenses;

  return (
    <div className="space-y-8">
      {/* Top KPI Cards Section */}
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
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/50 to-teal-200/50 rounded-unit opacity-0 group-hover:opacity-100 transition-opacity" />
              <KPICard
                title="Ventas"
                value={kpis?.salesToday?.total ?? 0}
                subtitle={`${kpis?.salesToday?.count ?? 0} ventas hoy`}
                description="Ingresos totales del día"
                href="/reports/sales"
                color="green"
                unit="S/"
                icon={<DollarSign className="h-6 w-6 text-white" />}
              />
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-rose-100/50 to-pink-200/50 rounded-unit opacity-0 group-hover:opacity-100 transition-opacity" />
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
              <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-purple-200/50 rounded-unit opacity-0 group-hover:opacity-100 transition-opacity" />
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
              <div className="absolute inset-0 bg-gradient-to-r from-red-100/50 to-red-200/50 rounded-unit opacity-0 group-hover:opacity-100 transition-opacity" />
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

      {/* Row 1: Sales Trend (Area Chart) & Most Requested Services (Horizontal Bar Chart) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LazyInteractiveChart
          title="Evolución de Ventas"
          description="Tendencia de ingresos diarios SPA"
          rangeOptions={[
            { label: '7D', value: 7 },
            { label: '14D', value: 14 },
            { label: '30D', value: 30 },
          ]}
          selectedRange={salesTrendDays}
          onRangeChange={(range) => setSalesTrendDays(Number(range))}
          badge={{
            text: `Total: S/ ${totalSalesInRange.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
            variant: 'success',
          }}
        >
          {loadingSalesTrend ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <LazyAreaChart
              data={
                salesTrend?.data?.map((d) => ({
                  ...d,
                  name: d.day || d.date,
                  ventas: d.ventas,
                })) ?? []
              }
              series={[
                {
                  dataKey: 'ventas',
                  color: 'var(--unit-accent)',
                  label: 'Ventas SPA (S/)',
                  gradientFrom: '#D4788C',
                  gradientTo: '#F43F5E',
                },
              ]}
              height={280}
            />
          )}
        </LazyInteractiveChart>

        <LazyInteractiveChart
          title="Servicios Más Solicitados"
          description="Ranking por volumen de atención"
          badge={{ text: 'Top 6', variant: 'info' }}
        >
          {loadingTopServices ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <LazyHorizontalBarChart
              data={
                topServices?.data?.map((s) => ({
                  name: s.serviceName,
                  value: s.count,
                  revenue: s.revenue,
                })) ?? []
              }
              valueKey="value"
              unitSuffix="servicios"
              color="#D4788C"
              colors={['#D4788C', '#ec4899', '#f43f5e', '#a855f7', '#8b5cf6', '#6366f1']}
              height={280}
            />
          )}
        </LazyInteractiveChart>
      </div>

      {/* Row 2: Most Profitable Services & Specialist Productivity (Composed Double Axis Chart) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LazyInteractiveChart
          title="Servicios Más Rentables"
          description="Top por ingresos generados (S/)"
          badge={{ text: 'Mayor Recaudación', variant: 'warning' }}
        >
          {loadingTopServices ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <LazyHorizontalBarChart
              data={
                topServices?.data?.map((s) => ({
                  name: s.serviceName,
                  value: s.revenue,
                  count: s.count,
                })) ?? []
              }
              valueKey="value"
              currencyFormat={true}
              color="#f59e0b"
              colors={['#f59e0b', '#d97706', '#b45309', '#eab308', '#ca8a04', '#a16207']}
              height={280}
            />
          )}
        </LazyInteractiveChart>

        <LazyInteractiveChart
          title="Productividad de Especialistas"
          description="Volumen de servicios vs Ticket promedio"
          rangeOptions={[
            { label: 'Semana', value: 'week' },
            { label: 'Mes', value: 'month' },
          ]}
          selectedRange={productivityRange}
          onRangeChange={(range) => setProductivityRange(String(range))}
        >
          {loadingProductivity ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <LazyComposedDoubleAxisChart
              data={
                productivity?.data?.map((p) => ({
                  name: p.employee,
                  servicios: p.servicesCount,
                  ticketPromedio: p.avgTicket,
                  avgDuration: p.avgDuration,
                })) ?? []
              }
              barKey="servicios"
              barLabel="Servicios"
              barColor="#D4788C"
              lineKey="ticketPromedio"
              lineLabel="Ticket Promedio"
              lineColor="#f59e0b"
              barUnitSuffix="servicios"
              lineIsCurrency={true}
              height={280}
            />
          )}
        </LazyInteractiveChart>
      </div>

      {/* Row 3: Cash Flow (Dual Bar Chart) & Appointments Funnel (Funnel Conversion Chart) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LazyInteractiveChart
          title="Flujo de Caja"
          description="Comparativa de Ingresos vs Egresos SPA"
          rangeOptions={[
            { label: '7D', value: 7 },
            { label: '14D', value: 14 },
            { label: '30D', value: 30 },
          ]}
          selectedRange={cashFlowDays}
          onRangeChange={(range) => setCashFlowDays(Number(range))}
          badge={{
            text: `Neto: S/ ${netCashBalance.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
            variant: netCashBalance >= 0 ? 'success' : 'danger',
          }}
        >
          {loadingCashFlow ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <LazyBarChart
              data={
                cashFlow?.data?.map((c) => ({
                  name: c.date,
                  ingresos: c.income,
                  egresos: c.expenses || 0,
                })) ?? []
              }
              series={[
                { dataKey: 'ingresos', color: 'var(--unit-success)', label: 'Ingresos' },
                { dataKey: 'egresos', color: 'var(--unit-error)', label: 'Egresos' },
              ]}
              height={280}
            />
          )}
        </LazyInteractiveChart>

        <LazyInteractiveChart
          title="Embudo de Agenda SPA"
          description="Tasa de conversión por etapas de citas"
          badge={{ text: 'Últimos 7 días', variant: 'neutral' }}
        >
          {loadingFunnel ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <LazyFunnelChart
              data={funnel?.data ?? []}
              height={280}
            />
          )}
        </LazyInteractiveChart>
      </div>

      {/* Row 4: Critical Inventory Horizontal Chart */}
      <div className="grid grid-cols-1 gap-6">
        <LazyInteractiveChart
          title="Inventario Crítico por Categoría"
          description="Productos SPA con existencias por debajo del stock mínimo"
          badge={{
            text: inventoryCritical?.data?.reduce((sum, c) => sum + c.products.length, 0)
              ? `${inventoryCritical.data.reduce((sum, c) => sum + c.products.length, 0)} críticos`
              : 'Stock Óptimo',
            variant: (inventoryCritical?.data?.reduce((sum, c) => sum + c.products.length, 0) || 0) > 0 ? 'danger' : 'success',
          }}
        >
          {loadingInventory ? (
            <Skeleton className="h-[260px] w-full" />
          ) : (
            <LazyHorizontalBarChart
              data={
                inventoryCritical?.data?.map((cat) => ({
                  name: cat.category,
                  value: cat.products.length,
                })) ?? []
              }
              valueKey="value"
              unitSuffix="productos"
              color="#ef4444"
              colors={['#ef4444', '#f97316', '#f59e0b', '#dc2626']}
              height={240}
              showRanking={false}
            />
          )}
        </LazyInteractiveChart>
      </div>
    </div>
  );
}
