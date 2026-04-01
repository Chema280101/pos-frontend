// Cash Register Types - Compartidos entre todos los componentes

export type BusinessUnit = 'SPA' | 'BARBERIA';
export type CashRegisterStatus = 'OPEN' | 'CLOSED';

export interface CashRegister {
  id: string;
  unit: BusinessUnit;
  openedById: string;
  closedById?: string;
  reopenedById?: string;
  reopenReason?: string;
  openedAt: string;
  closedAt?: string;
  openingAmount: number;
  closingDeclared?: number;
  closingExpected?: number;
  difference?: number;
  status: CashRegisterStatus;
  closingNotes?: string;
  closedBySignature?: string;
  expenses?: CashExpense[];
  sales?: any[];
}

export interface CashRegisterOpen {
  id: string;
  unit: string;
  openingAmount: number;
  openedAt: string;
  status: string;
}

export interface CashExpense {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
  cashRegisterId: string;
  createdBy: {
    id: string;
    name: string;
  };
  cashRegister: {
    id: string;
    unit: BusinessUnit;
    openedAt: string;
  };
}

export interface CashDenomination {
  denomination: number;
  quantity: number;
}

export interface CashRegisterSummary {
  opening: number;
  cash: number;
  card: number;
  transfer: number;
  wallet: number;
  cashEntries: number;
  totalSales: number;
  expenses: number;
  expectedCash: number;
}

export interface CashRegisterListResponse {
  data: CashRegister[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ExpenseFormData {
  amount: string;
  reason: string;
}

export interface CashEntryFormData {
  amount: string;
  reason: string;
  type: string;
}

export interface CashCloseFormData {
  denominations: CashDenomination[];
  notes: string;
  signature: string;
}
