'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { KPICard, Skeleton } from '@/components/ui';
import {
  LazyDonutChart,
  LazyAreaChart,
  LazyHorizontalBarChart,
  LazyComposedDoubleAxisChart,
  LazyFunnelChart,
  LazyBarChart,
  LazyInteractiveChart,
} from '@/components/Charts/LazyCharts';
import { ConsolidatedDashboardData } from './types';
import { DollarSign, Calendar, Users, Package } from 'lucide-react';

export function DashboardConsolidado(): JSX.Element {
  const { data: consolidatedData, isLoading } = useQuery({
    queryKey: ['dashboard', 'consolidated'],
    queryFn: async (): Promise<ConsolidatedDashboardData> => {
      const { data } = await api.get<ConsolidatedDashboardData>('/api/dashboard/consolidated');
      return data;
    },
    staleTime: 30 * 1000,
    retry: 3,
    refetchOnWindowFocus: false,
  });

  const spaKpis = consolidatedData?.spaKpis;
  const barbKpis = consolidatedData?.barberiaKpis;
  const spaSalesTrend = consolidatedData?.salesTrend?.spa || [];
  const barbSalesTrend = consolidatedData?.salesTrend?.barberia || [];
  const spaTopServices = consolidatedData?.topServices?.spa || [];
  const barbTopServices = consolidatedData?.topServices?.barberia || [];
  const spaProductivity = consolidatedData?.productivity?.spa || [];
  const barbProductivity = consolidatedData?.productivity?.barberia || [];
  const spaFunnel = consolidatedData?.funnel?.spa || [];
  const barbFunnel = consolidatedData?.funnel?.barberia || [];
  const spaCashFlow = consolidatedData?.cashFlow?.spa || [];
  const barbCashFlow = consolidatedData?.cashFlow?.barberia || [];
  const spaInventory = consolidatedData?.inventory?.spa || [];
  const barbInventory = consolidatedData?.inventory?.barberia || [];

  const spaSalesTotal = spaKpis?.salesToday?.total ?? 0;
  const spaSalesCount = spaKpis?.salesToday?.count ?? 0;
  const barbSalesTotal = barbKpis?.salesToday?.total ?? 0;
  const barbSalesCount = barbKpis?.salesToday?.count ?? 0;

  const totalSales = spaSalesTotal + barbSalesTotal;
  const totalSalesCount = spaSalesCount + barbSalesCount;

  const spaAppointments = spaKpis?.appointmentsToday ?? 0;
  const barbAppointments = barbKpis?.appointmentsToday ?? 0;
  const totalAppointments = spaAppointments + barbAppointments;

  const spaCompleted = spaKpis?.appointmentsTodayCompleted ?? 0;
  const barbCompleted = barbKpis?.appointmentsTodayCompleted ?? 0;
  const totalCompleted = spaCompleted + barbCompleted;

  const spaPending = spaKpis?.pendingSales?.total ?? 0;
  const barbPending = barbKpis?.pendingSales?.total ?? 0;
  const totalPending = spaPending + barbPending;

  const spaLowStock = spaKpis?.lowStockCount ?? 0;
  const barbLowStock = barbKpis?.lowStockCount ?? 0;
  const totalLowStock = spaLowStock + barbLowStock;

  // Merge Sales Trend by Date for Multi-Unit Area Chart
  const mergedSalesTrend = useMemo(() => {
    const dateMap = new Map<string, { name: string; spaVentas: number; barbVentas: number; total: number }>();

    spaSalesTrend.forEach((item) => {
      const key = item.date;
      if (!dateMap.has(key)) {
        dateMap.set(key, { name: item.day || item.date, spaVentas: item.ventas, barbVentas: 0, total: item.ventas });
      } else {
        const entry = dateMap.get(key)!;
        entry.spaVentas = item.ventas;
        entry.total += item.ventas;
      }
    });

    barbSalesTrend.forEach((item) => {
      const key = item.date;
      if (!dateMap.has(key)) {
        dateMap.set(key, { name: item.day || item.date, spaVentas: 0, barbVentas: item.ventas, total: item.ventas });
      } else {
        const entry = dateMap.get(key)!;
        entry.barbVentas = item.ventas;
        entry.total += item.ventas;
      }
    });

    return Array.from(dateMap.values());
  }, [spaSalesTrend, barbSalesTrend]);

  // Merge Top Services Ranked by Revenue
  const mergedTopServices = useMemo(() => {
    const combined = [...spaTopServices, ...barbTopServices];
    const map = new Map<string, { serviceName: string; revenue: number; count: number }>();
    combined.forEach((s) => {
      if (!map.has(s.serviceName)) {
        map.set(s.serviceName, { ...s });
      } else {
        const curr = map.get(s.serviceName)!;
        curr.revenue += s.revenue;
        curr.count += s.count;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  }, [spaTopServices, barbTopServices]);

  // Merge Productivity
  const mergedProductivity = useMemo(() => {
    return [...spaProductivity, ...barbProductivity].map((p) => ({
      name: p.employee,
      servicios: p.servicesCount,
      ticketPromedio: p.avgTicket,
    }));
  }, [spaProductivity, barbProductivity]);

  // Merge Funnel
  const mergedFunnel = useMemo(() => {
    const stageMap = new Map<string, number>();
    [...spaFunnel, ...barbFunnel].forEach((f) => {
      stageMap.set(f.stage, (stageMap.get(f.stage) || 0) + f.count);
    });
    return Array.from(stageMap.entries()).map(([stage, count]) => ({ stage, count }));
  }, [spaFunnel, barbFunnel]);

  // Merge Cash Flow
  const mergedCashFlow = useMemo(() => {
    const dateMap = new Map<string, { name: string; income: number; expenses: number }>();
    [...spaCashFlow, ...barbCashFlow].forEach((c) => {
      if (!dateMap.has(c.date)) {
        dateMap.set(c.date, { name: c.date, income: c.income, expenses: c.expenses || 0 });
      } else {
        const curr = dateMap.get(c.date)!;
        curr.income += c.income;
        curr.expenses += (c.expenses || 0);
      }
    });
    return Array.from(dateMap.values());
  }, [spaCashFlow, barbCashFlow]);

  // Merge Inventory Critical
  const mergedInventory = useMemo(() => {
    const catMap = new Map<string, number>();
    [...spaInventory, ...barbInventory].forEach((cat) => {
      catMap.set(cat.category, (catMap.get(cat.category) || 0) + cat.products.length);
    });
    return Array.from(catMap.entries()).map(([category, count]) => ({
      name: category,
      value: count,
    }));
  }, [spaInventory, barbInventory]);

  const totalCashIncome = mergedCashFlow.reduce((sum, item) => sum + item.income, 0);
  const totalCashExpenses = mergedCashFlow.reduce((sum, item) => sum + item.expenses, 0);
  const netCashBalance = totalCashIncome - totalCashExpenses;

  return (
    <div className="space-y-8">
      {/* Top KPI Cards Section */}
      <section aria-label="Indicadores Consolidados">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[120px] w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 transition-all duration-300">
            <KPICard
              title="Ventas Totales"
              value={totalSales}
              subtitle={`${totalSalesCount} ventas consolidadas`}
              description="Ingresos SPA + Barbería"
              href="/reports/sales"
              color="green"
              unit="S/"
              icon={<DollarSign className="h-6 w-6 text-white" />}
            />
            <KPICard
              title="Citas Totales"
              value={totalAppointments}
              subtitle={`${totalCompleted} de ${totalAppointments} completadas`}
              description="Citas programadas en ambas unidades"
              href="/appointments"
              color="blue"
              icon={<Calendar className="h-6 w-6 text-white" />}
            />
            <KPICard
              title="Pendientes Totales"
              value={(spaKpis?.pendingSales?.count ?? 0) + (barbKpis?.pendingSales?.count ?? 0)}
              subtitle={`S/ ${totalPending.toFixed(2)} en espera`}
              description="Ventas sin liquidar consolidadas"
              href="/pos"
              color="purple"
              icon={<Users className="h-6 w-6 text-white" />}
            />
            <KPICard
              title="Stock Bajo Total"
              value={totalLowStock}
              subtitle={totalLowStock > 0 ? 'Revisar inventario consolidado' : 'Todo OK'}
              description="Productos con bajo stock en ambas unidades"
              href="/inventory/products"
              critical={totalLowStock > 0}
              color="red"
              icon={<Package className="h-6 w-6 text-white" />}
            />
          </div>
        )}
      </section>

      {/* Row 1: Donut Charts for Sales & Appointments Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LazyInteractiveChart
          title="Participación de Ventas"
          description="Distribución de ingresos de hoy (SPA vs Barbería)"
          badge={{ text: 'Hoy', variant: 'neutral' }}
        >
          {spaKpis || barbKpis ? (
            <LazyDonutChart
              data={[
                { name: 'SPA', value: spaKpis?.salesToday?.total ?? 0, color: 'var(--unit-accent)' },
                { name: 'Barbería', value: barbKpis?.salesToday?.total ?? 0, color: 'var(--unit-success)' },
              ]}
              centerSubtitle="Ventas Hoy"
              currencyFormat={true}
              height={280}
            />
          ) : (
            <Skeleton className="h-[280px] w-full" />
          )}
        </LazyInteractiveChart>

        <LazyInteractiveChart
          title="Distribución de Citas"
          description="Participación de citas del día por unidad"
          badge={{ text: 'Hoy', variant: 'neutral' }}
        >
          {spaKpis || barbKpis ? (
            <LazyDonutChart
              data={[
                { name: 'SPA', value: spaKpis?.appointmentsToday ?? 0, color: 'var(--unit-accent)' },
                { name: 'Barbería', value: barbKpis?.appointmentsToday ?? 0, color: 'var(--unit-info)' },
              ]}
              centerSubtitle="Citas Hoy"
              currencyFormat={false}
              height={280}
            />
          ) : (
            <Skeleton className="h-[280px] w-full" />
          )}
        </LazyInteractiveChart>
      </div>

      {/* Row 2: Sales Trend (Multi-Series Area Chart) & Most Profitable Services (Horizontal Bar Chart) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LazyInteractiveChart
          title="Evolución de Ventas por Unidad"
          description="Comparativa de ventas diarias SPA vs Barbería"
          badge={{ text: 'Últimos 7 días', variant: 'success' }}
        >
          {isLoading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <LazyAreaChart
              data={mergedSalesTrend}
              series={[
                {
                  dataKey: 'spaVentas',
                  color: 'var(--unit-accent)',
                  label: 'SPA (S/)',
                  gradientFrom: '#D4788C',
                  gradientTo: '#F43F5E',
                },
                {
                  dataKey: 'barbVentas',
                  color: 'var(--unit-success)',
                  label: 'Barbería (S/)',
                  gradientFrom: '#10b981',
                  gradientTo: '#059669',
                },
              ]}
              height={280}
            />
          )}
        </LazyInteractiveChart>

        <LazyInteractiveChart
          title="Servicios Más Rentables"
          description="Top por ingresos consolidados (S/)"
          badge={{ text: 'Top 6 General', variant: 'warning' }}
        >
          {isLoading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <LazyHorizontalBarChart
              data={mergedTopServices.map((s) => ({
                name: s.serviceName,
                value: s.revenue,
                count: s.count,
              }))}
              valueKey="value"
              currencyFormat={true}
              color="#f59e0b"
              colors={['#f59e0b', '#d97706', '#b45309', '#eab308', '#ca8a04', '#a16207']}
              height={280}
            />
          )}
        </LazyInteractiveChart>
      </div>

      {/* Row 3: Employee Productivity (Composed Double Axis Chart) & Appointments Funnel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LazyInteractiveChart
          title="Productividad del Personal (Consolidado)"
          description="Volumen de servicios vs Ticket promedio"
        >
          {isLoading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <LazyComposedDoubleAxisChart
              data={mergedProductivity}
              barKey="servicios"
              barLabel="Servicios"
              barColor="#8b5cf6"
              lineKey="ticketPromedio"
              lineLabel="Ticket Promedio"
              lineColor="#f59e0b"
              barUnitSuffix="servicios"
              lineIsCurrency={true}
              height={280}
            />
          )}
        </LazyInteractiveChart>

        <LazyInteractiveChart
          title="Embudo de Agenda Consolidado"
          description="Conversión de citas entre ambas unidades"
          badge={{ text: 'Últimos 7 días', variant: 'neutral' }}
        >
          {isLoading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <LazyFunnelChart
              data={mergedFunnel}
              height={280}
            />
          )}
        </LazyInteractiveChart>
      </div>

      {/* Row 4: Cash Flow (Dual Bar Chart) & Critical Inventory */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LazyInteractiveChart
          title="Flujo de Caja Consolidado"
          description="Comparativa global de Ingresos vs Egresos"
          badge={{
            text: `Neto: S/ ${netCashBalance.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
            variant: netCashBalance >= 0 ? 'success' : 'danger',
          }}
        >
          {isLoading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <LazyBarChart
              data={mergedCashFlow.map((c) => ({
                name: c.name,
                ingresos: c.income,
                egresos: c.expenses,
              }))}
              series={[
                { dataKey: 'ingresos', color: 'var(--unit-success)', label: 'Ingresos' },
                { dataKey: 'egresos', color: 'var(--unit-error)', label: 'Egresos' },
              ]}
              height={280}
            />
          )}
        </LazyInteractiveChart>

        <LazyInteractiveChart
          title="Inventario Crítico Consolidado"
          description="Productos con existencias bajas por categoría"
          badge={{
            text: `${mergedInventory.reduce((sum, c) => sum + c.value, 0)} productos`,
            variant: mergedInventory.reduce((sum, c) => sum + c.value, 0) > 0 ? 'danger' : 'success',
          }}
        >
          {isLoading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <LazyHorizontalBarChart
              data={mergedInventory}
              valueKey="value"
              unitSuffix="productos"
              color="#ef4444"
              colors={['#ef4444', '#f97316', '#f59e0b', '#dc2626']}
              height={280}
              showRanking={false}
            />
          )}
        </LazyInteractiveChart>
      </div>
    </div>
  );
}
