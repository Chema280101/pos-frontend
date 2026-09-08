// Types para el sistema de comisiones

export type CommissionStatus = 'PENDING' | 'APPROVED' | 'PAID';
export type BusinessUnit = 'SPA' | 'BARBERÍA';

export interface Commission {
  id: string;
  amount: number;
  pctApplied: number;
  status: CommissionStatus;
  paidAt: string | null;
  paymentMethod: string | null;
  paymentNotes: string | null;
  createdAt: string;
  updatedAt: string;
  basedOnGross: boolean;
  user: {
    id: string;
    name: string;
    unit: BusinessUnit | null;
    commissionPct: number | null;
  };
  sale: {
    id: string;
    saleNumber: string;
    unit: BusinessUnit;
    total: number;
    createdAt: string;
  } | null;
  approvedBy?: {
    id: string;
    name: string;
  } | null;
}

export interface GroupedCommission {
  id: string;
  userId: string;
  userName: string;
  userUnit: string;
  date: string;
  totalAmount: number;
  commissionCount: number;
  status: CommissionStatus;
  paidAt: string | null;
  paymentMethod: string | null;
  paymentNotes: string | null;
  createdAt: string;
  updatedAt: string;
  commissionIds?: string[]; // ✅ IDs de comisiones individuales reales
  sales: Array<{
    id: string;
    saleNumber: string;
    amount: number;
    createdAt: string;
    itemType?: string;
    itemName?: string;
    pctApplied?: number;
  }>;
  user: {
    id: string;
    name: string;
    unit: string;
  };
  sale: {
    id: string;
    saleNumber: string;
    unit: string;
    total: number;
    createdAt: string;
  } | null;
  // Propiedades adicionales que envía el backend
  employeeId: string;
  employeeName: string;
  employeeUnit: string;
  totalSales: number;
  commissions: any[];
}

export interface CommissionsResponse {
  data: Commission[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface GroupedCommissionsResponse {
  data: GroupedCommission[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface CommissionFilters {
  dateFrom?: Date;
  dateTo?: Date;
  unit?: BusinessUnit;
  userId?: string;
  amountRange?: '0-50' | '50-100' | '100-200' | '200-500' | '500+';
  paymentMethod?: string;
  status?: CommissionStatus;
}

export interface CreateCommissionData {
  userId: string;
  saleId: string;
  amount: number;
  pctApplied: number;
  basedOnGross?: boolean;
}

export interface UpdateCommissionData {
  paymentMethod?: string;
  paymentNotes?: string;
  status?: CommissionStatus;
}
