'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { KPICard, Skeleton } from '@/components/ui';
import { LazyBarChart, LazyPieChart, LazyInteractiveChart } from '@/components/Charts/LazyCharts';
import { 
  UnitKpis, 
  SalesTrendItem, 
  TopServiceItem, 
  ProductivityItem, 
  FunnelItem, 
  CashFlowItem, 
  CriticalInventoryItem,
  ConsolidatedDashboardData 
} from './types';
import { DollarSign, Calendar, Users, Package, AlertTriangle } from 'lucide-react';

const ChartSkeleton = () => <Skeleton className="h-[260px] w-full" />;

export function DashboardConsolidado(): JSX.Element {
  const { data: consolidatedData, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'consolidated'],
    queryFn: async (): Promise<ConsolidatedDashboardData> => {
      const { data } = await api.get<ConsolidatedDashboardData>('/api/dashboard/consolidated');
      return data;
    },
    staleTime: 30 * 1000,
    retry: 3,
    refetchOnWindowFocus: false,
  });

  // Manejo de errores
  React.useEffect(() => {
    // Silenciar errores de dashboard para mantener console limpio
  }, [error]);

  const spaKpis = consolidatedData?.spaKpis;
  const barbKpis = consolidatedData?.barberiaKpis;
  const spaSalesTrend = consolidatedData?.salesTrend?.spa;
  const barbSalesTrend = consolidatedData?.salesTrend?.barberia;
  const spaTopServices = consolidatedData?.topServices?.spa;
  const barbTopServices = consolidatedData?.topServices?.barberia;
  const spaProductivity = consolidatedData?.productivity?.spa;
  const barbProductivity = consolidatedData?.productivity?.barberia;
  const spaFunnel = consolidatedData?.funnel?.spa;
  const barbFunnel = consolidatedData?.funnel?.barberia;
  const spaCashFlow = consolidatedData?.cashFlow?.spa;
  const barbCashFlow = consolidatedData?.cashFlow?.barberia;
  const spaInventory = consolidatedData?.inventory?.spa;
  const barbInventory = consolidatedData?.inventory?.barberia;

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

  return (
    <div className="space-y-8">
      <section aria-label="Indicadores Consolidados">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[120px] w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 transition-all duration-300">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-green-200/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
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
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-blue-200/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <KPICard
                title="Citas Totales"
                value={totalAppointments}
                subtitle={`${totalCompleted} de ${totalAppointments} completadas`}
                description="Citas programadas en ambas unidades"
                href="/appointments"
                color="blue"
                icon={<Calendar className="h-6 w-6 text-white" />}
              />
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-purple-200/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <KPICard
                title="Pendientes Totales"
                value={(spaKpis?.pendingSales?.count ?? 0) + (barbKpis?.pendingSales?.count ?? 0)}
                subtitle={`S/ ${totalPending.toFixed(2)} en espera`}
                description="Ventas sin liquidar consolidadas"
                href="/pos"
                color="purple"
                icon={<Users className="h-6 w-6 text-white" />}
              />
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-red-100/50 to-red-200/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
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
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LazyInteractiveChart title="Distribución de ventas por unidad" description="Ventas hoy SPA vs Barbería">
          {(spaKpis || barbKpis) ? (
            <LazyPieChart
              data={[
                { name: 'SPA', value: spaKpis?.salesToday?.total ?? 0, color: '#10b981' },
                { name: 'Barbería', value: barbKpis?.salesToday?.total ?? 0, color: '#f59e0b' }
              ]}
            />
          ) : (
            <Skeleton className="h-[260px] w-full" />
          )}
        </LazyInteractiveChart>

        <LazyInteractiveChart title="Distribución de citas por unidad" description="Citas hoy SPA vs Barbería">
          {(spaKpis || barbKpis) ? (
            <LazyPieChart
              data={[
                { name: 'SPA', value: spaKpis?.appointmentsToday ?? 0, color: '#3b82f6' },
                { name: 'Barbería', value: barbKpis?.appointmentsToday ?? 0, color: '#8b5cf6' }
              ]}
            />
          ) : (
            <Skeleton className="h-[260px] w-full" />
          )}
        </LazyInteractiveChart>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LazyInteractiveChart title="Tendencia de ventas y ticket promedio" description="Últimos 7 días (consolidado)">
          {consolidatedData?.salesTrend ? (
            <LazyBarChart
              data={[...consolidatedData.salesTrend.spa, ...consolidatedData.salesTrend.barberia].map(d => ({ ...d, name: d.date }))}
              series={[{ dataKey: "ventas", color: "#10b981", label: "Ventas" }]}
            />
          ) : (
            <Skeleton className="h-[260px] w-full" />
          )}
        </LazyInteractiveChart>

        <LazyInteractiveChart title="Servicios más rentables" description="Top 10 por ingresos (consolidado)">
          {consolidatedData?.topServices ? (
            <LazyBarChart
              data={[...consolidatedData.topServices.spa, ...consolidatedData.topServices.barberia].map(s => ({ ...s, name: s.serviceName, ingresos: s.revenue }))}
              series={[{ dataKey: "ingresos", color: "#f59e0b", label: "Ingresos" }]}
            />
          ) : (
            <Skeleton className="h-[260px] w-full" />
          )}
        </LazyInteractiveChart>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LazyInteractiveChart title="Productividad de empleados" description="Servicios realizados y ticket promedio (consolidado)">
          {consolidatedData?.productivity ? (
            <LazyBarChart
              data={[...consolidatedData.productivity.spa, ...consolidatedData.productivity.barberia].map((p: any) => ({ ...p, name: p.employee, servicios: p.servicesCount, ticketPromedio: p.avgTicket }))}
              series={[
                { dataKey: "servicios", color: "#8b5cf6", label: "Servicios" },
                { dataKey: "ticketPromedio", color: "#f59e0b", label: "Ticket Promedio" }
              ]}
            />
          ) : (
            <Skeleton className="h-[260px] w-full" />
          )}
        </LazyInteractiveChart>

        <LazyInteractiveChart title="Embudo de citas" description="Conversión por etapa (consolidado)">
          {consolidatedData?.funnel ? (
            <LazyBarChart
              data={[...consolidatedData.funnel.spa, ...consolidatedData.funnel.barberia].map((f: any) => ({ ...f, name: f.stage }))}
              series={[{ dataKey: "count", color: "#ef4444", label: "Cantidad" }]}
            />
          ) : (
            <Skeleton className="h-[260px] w-full" />
          )}
        </LazyInteractiveChart>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LazyInteractiveChart title="Flujo de caja" description="Ingresos vs egresos (consolidado)">
          {consolidatedData?.cashFlow ? (
            <LazyBarChart
              data={[...consolidatedData.cashFlow.spa, ...consolidatedData.cashFlow.barberia].map((c: any) => ({ ...c, name: c.date }))}
              series={[{ dataKey: "income", color: "#10b981", label: "Ingresos" }]}
            />
          ) : (
            <Skeleton className="h-[260px] w-full" />
          )}
        </LazyInteractiveChart>

        <LazyInteractiveChart title="Inventario crítico" description="Productos con stock bajo (consolidado)">
          {consolidatedData?.inventory ? (
            <div className="space-y-4">
              {[...consolidatedData.inventory.spa, ...consolidatedData.inventory.barberia].map((cat: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <span className="font-medium">{cat.category}</span>
                  <span className="text-red-600 font-bold">{cat.products.length}</span>
                </div>
              ))}
            </div>
          ) : (
            <Skeleton className="h-[260px] w-full" />
          )}
        </LazyInteractiveChart>
      </div>
    </div>
  );
}
