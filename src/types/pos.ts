// POS Types - Compartidos entre todos los componentes

export type BusinessUnit = 'SPA' | 'BARBERIA';
export type ItemType = 'SERVICE' | 'PRODUCT' | 'PACKAGE';
export type PriceType = 'FIXED' | 'VARIABLE' | 'RANGE' | 'QUOTE';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CartItem {
  itemType: ItemType;
  referenceId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  employeeId?: string;
  packageId?: string;
  customPrice?: number; // Para precios variables
  requiresApproval?: boolean;
  approvalId?: string;
}

export interface PendingSale {
  id: string;
  saleNumber: string;
  unit: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  balance: number;
  customer: { id: string; name: string; phone: string } | null;
  items: Array<{ name: string; unitPrice: number; quantity: number; subtotal: number }>;
  [key: string]: unknown;
}

export interface CustomerOption {
  id: string;
  name: string;
  phone: string;
  creditBalance?: number;
}

export interface ServiceOption {
  id: string;
  name: string;
  price: number | string;
  durationMin?: number;
  unit?: string;
  priceType?: PriceType;
  minPrice?: number;
  maxPrice?: number;
  requiresApproval?: boolean;
  customPrice?: number; // ✅ Agregado para servicios con aprobación
}

export interface ProductOption {
  id: string;
  name: string;
  salePrice: number | null;
  stock?: number;
  unit?: string;
}

export interface PackageOption {
  id: string;
  name: string;
  fixedPrice: number | string;
  services?: Array<{ name: string }>;
  unit?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: any;
  type: 'CASH' | 'CARD' | 'TRANSFER' | 'WALLET' | 'MIXED';
}

export interface ReceiptSaleData {
  saleNumber: string;
  customer?: string;
  items: Array<{ name: string; quantity: number; unitPrice: number; subtotal: number }>;
  subtotal: number;
  discountAmount: number;
  total: number;
  paymentMethod: string;
  paymentDetail?: Record<string, number>;
  createdAt: string;
  unit: string;
}

// Tipos para validación de precios
export interface PriceValidation {
  valid: boolean;
  requiresApproval: boolean;
  canProceed: boolean;
  message?: string;
  approvalData?: {
    serviceId: string;
    requestedPrice: number;
    reason: string;
  };
}

export interface PriceApproval {
  id: string;
  serviceId: string;
  saleItemId: string;
  requestedPrice: number;
  approvedPrice?: number;
  status: ApprovalStatus;
  requestedById: string;
  approvedById?: string;
  reason?: string;
  createdAt: string;
  approvedAt?: string;
  service: {
    id: string;
    name: string;
    priceType: PriceType;
    minPrice?: number;
    maxPrice?: number;
  };
  requestedBy: {
    id: string;
    name: string;
    role: string;
  };
  approvedBy?: {
    id: string;
    name: string;
    role: string;
  };
}
