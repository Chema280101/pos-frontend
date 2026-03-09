export interface Client {
  id: string;
  name: string;
  phone: string;
  gender: string | null;
  howFoundUs: string | null;
  preferenceNotes: string | null;
  freeNotes: string | null;
  usualProducts: string | null;
  preferredEmployeeId: string | null;
  creditBalance: number;
  isBlocked: boolean;
  blockReason: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { appointments: number; sales: number };
}

export interface ClientHistory {
  appointments: Array<{
    id: string;
    unit: string;
    status: string;
    startTime: string;
    endTime: string;
    services: string;
  }>;
  sales: Array<{
    id: string;
    saleNumber: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
  creditMovements: Array<{
    id: string;
    amount: number;
    reason: string;
    createdAt: string;
  }>;
}
