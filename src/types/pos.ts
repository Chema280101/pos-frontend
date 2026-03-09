// POS Types - Compartidos entre todos los componentes

export type BusinessUnit = 'SPA' | 'BARBERIA';
export type ItemType = 'SERVICE' | 'PRODUCT' | 'PACKAGE';

export interface CartItem {
  itemType: ItemType;
  referenceId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  employeeId?: string;
  packageId?: string;
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
