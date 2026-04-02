// Dashboard Types - Compartidos entre todos los componentes
export interface UnitKpis {
  salesToday: { count: number; total: number };
  appointmentsToday: number;
  appointmentsTodayCompleted: number;
  appointmentsTodayPending: number;
  lowStockCount: number;
  lowStockProducts: Array<{ id: string; name: string; stock: number; minStock: number }>;
  pendingSales: { count: number; total: number };
  salesByDay?: Array<{ name: string; ventas: number }>;
  topServices?: Array<{ name: string; cantidad: number }>;
}

export interface SalesTrendItem {
  date: string;
  day: string;
  ventas: number;
  cantidad: number;
  ticketPromedio: number;
}

export interface TopServiceItem {
  serviceName: string;
  count: number;
  revenue: number;
}

export interface ProductivityItem {
  employee: string;
  servicesCount: number;
  avgDuration: number;
  avgTicket: number;
}

export interface FunnelItem {
  stage: string;
  count: number;
}

export interface CashFlowItem {
  date: string;
  income: number;
  expenses: number;
}

export interface CriticalInventoryItem {
  category: string;
  products: Array<{ name: string; stock: number; minStock: number }>;
}

export type DashboardView = 'SPA' | 'BARBERIA' | 'CONSOLIDADO';

export interface ConsolidatedDashboardData {
  spaKpis: UnitKpis;
  barberiaKpis: UnitKpis;
  salesTrend: { spa: SalesTrendItem[]; barberia: SalesTrendItem[] };
  topServices: { spa: TopServiceItem[]; barberia: TopServiceItem[] };
  productivity: { spa: ProductivityItem[]; barberia: ProductivityItem[] };
  funnel: { spa: FunnelItem[]; barberia: FunnelItem[] };
  cashFlow: { spa: CashFlowItem[]; barberia: CashFlowItem[] };
  inventory: { spa: CriticalInventoryItem[]; barberia: CriticalInventoryItem[] };
}
