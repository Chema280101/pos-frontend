// Types unificados para el sistema de reportes

export type BusinessUnit = 'SPA' | 'BARBERÍA';
export type ReportType = 'sale' | 'appointment' | 'client' | 'product' | 'commission' | 'cash-register';
export type ReportStatus = 'PENDING' | 'CLOSED' | 'CANCELLED' | 'COMPLETED' | 'OPEN' | 'PAID' | 'APPROVED';

// Interface unificada para datos de reportes
export interface UnifiedReportData {
  id: string;
  type: ReportType;
  referenceId: string;
  title: string;
  subtitle?: string;
  amount?: number;
  status?: string;
  date: string;
  unit: BusinessUnit;
  customer?: string;
  employee?: string;
  details?: Record<string, any>;
}

// Interface para respuesta paginada
export interface PaginatedReportResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Interface para filtros de reportes
export interface ReportFilters {
  unit?: BusinessUnit;
  dateFrom?: Date;
  dateTo?: Date;
  type?: ReportType;
  status?: ReportStatus;
  searchTerm?: string;
  hasAmount?: boolean;
  hasCustomer?: boolean;
  hasEmployee?: boolean;
}

// Interface para parámetros de reportes
export interface ReportParams extends ReportFilters {
  page?: number;
  limit?: number;
}

// Interface para métricas de overview
export interface OverviewMetrics {
  totalSales: number;
  totalRevenue: number;
  totalAppointments: number;
  uniqueClients: number;
  topService?: {
    name: string;
    count: number;
  };
  topEmployee?: {
    name: string;
    sales: number;
  };
  lowStockProducts: number;
}

// Interface para reporte de ventas
export interface SalesReport {
  id: string;
  saleNumber: string;
  unit: BusinessUnit;
  total: number;
  status: string;
  createdAt: string;
  customerName?: string;
  employeeName?: string;
}

// Interface para reporte de citas
export interface AppointmentsReport {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  unit: BusinessUnit;
  customerName: string;
  employeeName: string;
  serviceName: string;
}

// Interface para reporte de clientes
export interface ClientsReport {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  createdAt: string;
  totalVisits: number;
  totalSpent: number;
}

// Interface para reporte de inventario
export interface InventoryReport {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  costPrice?: number;
  salePrice?: number;
  unit: BusinessUnit;
  category?: string;
}

// Interface para reporte de comisiones
export interface CommissionsReport {
  id: string;
  amount: number;
  pctApplied: number;
  status: string;
  createdAt: string;
  userName: string;
  saleNumber?: string;
}

// Interface para reporte de caja
export interface CashRegisterReport {
  id: string;
  openedAt: string;
  closedAt?: string;
  openingAmount: number;
  closingDeclared?: number;
  closingExpected?: number;
  difference?: number;
  unit: BusinessUnit;
  status: string;
}

// Interface para exportación
export interface ExportParams extends ReportFilters {
  format: 'csv' | 'excel' | 'pdf';
}
