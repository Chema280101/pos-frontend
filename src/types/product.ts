export interface Product {
  id: string;
  name: string;
  description?: string | null;
  unit: 'SPA' | 'BARBERIA';
  type: 'INTERNAL_USE' | 'FOR_SALE' | 'BOTH';
  category: { id: string; name: string } | null;
  supplier?: { id: string; name: string } | null;
  measureUnit: string | null;
  salePrice: number | null;
  costPrice: number | null;
  stock: number;
  minStock: number;
  maxStock: number | null;
  barcode: string | null;
  commissionFixed: number | null;
  isActive: boolean;
  timesVended: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string | null;
  unit?: 'SPA' | 'BARBERIA' | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    stockEntries: number;
  };
}

export interface StockMovement {
  id: string;
  productId: string;
  product: Product;
  type: 'ENTRY' | 'EXIT' | 'INTERNAL_USE' | 'SALE' | 'ADJUSTMENT';
  quantity: number;
  reason: string | null;
  reference?: string | null;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  };
}
