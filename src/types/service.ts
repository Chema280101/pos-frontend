export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMin: number;
  unit: 'SPA' | 'BARBERIA';
  categoryId: string | null;
  category: { id: string; name: string } | null;
  isComboEligible: boolean;
  imageUrl: string | null;
  isActive: boolean;
  timesVended: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  unit: 'SPA' | 'BARBERIA';
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Package {
  id: string;
  name: string;
  description: string | null;
  fixedPrice: number;
  durationMin: number;
  unit: 'SPA' | 'BARBERIA';
  status: 'ACTIVE' | 'INACTIVE';
  timesVended: number;
  imageUrl: string | null;
  services: Array<{
    id: string;
    serviceId: string;
    service: { id: string; name: string; durationMin: number };
    employeeId: string | null;
    commissionShare: number | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceMovement {
  id: string;
  saleId: string;
  serviceId: string;
  service: { id: string; name: string };
  unitPrice: number;
  quantity: number;
  subtotal: number;
  discountAmount: number;
  discountReason: string | null;
  createdAt: string;
  sale: {
    id: string;
    saleNumber: string;
    customer: { id: string; name: string } | null;
  };
}

export interface ServiceOption {
  id: string;
  name: string;
  durationMin: number;
  unit: 'SPA' | 'BARBERIA';
  price: number;
}
