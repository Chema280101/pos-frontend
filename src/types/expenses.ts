// Expenses Types - Compartidos entre todos los componentes

export type BusinessUnit = 'SPA' | 'BARBERIA';

export interface Expense {
  id: string;
  amount: number;
  reason: string;
  category?: string;
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

export interface ExpenseListResponse {
  data: Expense[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateExpenseRequest {
  amount: number;
  reason: string;
  cashRegisterId: string;
}

export interface UpdateExpenseRequest {
  amount?: number;
  reason?: string;
}

export interface ExpenseFormData {
  amount: string;
  reason: string;
}

export interface ExpenseFilters {
  searchTerm: string;
  unitFilter: 'ALL' | BusinessUnit;
  dateFilter: 'ALL' | 'TODAY' | 'WEEK' | 'MONTH';
}

export interface ExpenseModalsState {
  viewModal: boolean;
  editModal: boolean;
  deleteModal: boolean;
  selectedExpense: Expense | null;
  editAmount: string;
  editReason: string;
}
