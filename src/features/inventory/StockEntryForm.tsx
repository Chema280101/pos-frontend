import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { ArrowUpRight, Package, Save, X, AlertCircle, Loader2, Plus, DollarSign, FileText, Calendar, Users } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  stock: number;
  measureUnit: string | null;
  unit: string;
}

interface Supplier {
  id: string;
  name: string;
}

export function StockEntryForm(): JSX.Element {
  const queryClient = useQueryClient();
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');

  const { data: products } = useQuery({
    queryKey: ['inventory-products'],
    queryFn: async (): Promise<Product[]> => {
      const { data } = await api.get<{ data: Product[] }>('/api/inventory/products');
      return data.data; // Extract the array from paginated response
    },
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async (): Promise<Supplier[]> => {
      const { data } = await api.get<{ data: Supplier[] }>('/api/inventory/suppliers');
      return data.data || data; // Handle paginated response
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/inventory/movements/entry', {
        productId,
        quantity: Number(quantity),
        supplierId: supplierId || undefined,
        costPrice: costPrice ? Number(costPrice) : undefined,
        invoiceNumber: invoiceNumber.trim() || undefined,
        invoiceDate: invoiceDate || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      setProductId('');
      setQuantity('');
      setSupplierId('');
      setCostPrice('');
      setInvoiceNumber('');
      setInvoiceDate('');
    },
  });

  const canSubmit = productId && Number(quantity) > 0;
  const selectedProduct = products?.find((p) => p.id === productId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--unit-surface)] via-[var(--unit-surface-elevated)] to-[var(--unit-surface)] relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="relative max-w-2xl mx-auto p-6">
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-4">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-sm font-medium text-[var(--unit-text)]">
              Movimiento de inventario
            </span>
          </div>
          <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">
            Entrada de Stock
          </h1>
          <p className="text-[var(--unit-text-muted)]">
            Registra la entrada de productos por compra o adquisición
          </p>
        </div>

        {/* Enhanced Form Container */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm shadow-2xl">
          {/* Form Header */}
          <div className="relative bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 px-6 py-4 border-b border-emerald-500/30">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                <ArrowUpRight className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--unit-text)]">Información de entrada</h2>
                <p className="text-sm text-[var(--unit-text-muted)]">Completa los datos del movimiento</p>
              </div>
            </div>
          </div>

          {/* Enhanced Error Alert */}
          {mutation.error && (
            <div className="mx-6 mt-4 rounded-xl border-2 border-red-500/30 bg-gradient-to-br from-red-50 to-red-100 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 shadow-lg">
                  <AlertCircle className="h-4 w-4 text-white" />
                </div>
                <p className="font-medium text-red-800">
                  {mutation.error instanceof Error ? mutation.error.message : 'Error al registrar entrada'}
                </p>
              </div>
            </div>
          )}

          {/* Enhanced Form Content */}
          <div className="p-6 space-y-6">
            {/* Enhanced Product Field */}
            <div>
              <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Producto *</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              >
                <option value="">Seleccionar producto...</option>
                {(products ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (stock actual: {p.stock} {p.measureUnit ?? ''})
                  </option>
                ))}
              </select>
              {selectedProduct && (
                <div className="mt-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-sm text-emerald-700 font-medium">
                    📦 Stock actual: {selectedProduct.stock} {selectedProduct.measureUnit || 'unidades'}
                  </p>
                </div>
              )}
            </div>

            {/* Enhanced Quantity Field */}
            <div>
              <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Cantidad *</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ingresa la cantidad a agregar"
                className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
              {selectedProduct && quantity && Number(quantity) > 0 && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700 font-medium">
                    📈 Nuevo stock: {selectedProduct.stock + Number(quantity)} {selectedProduct.measureUnit || 'unidades'}
                  </p>
                </div>
              )}
            </div>

            {/* Enhanced Supplier Field */}
            <div>
              <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Proveedor</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              >
                <option value="">Seleccionar proveedor (opcional)...</option>
                {(suppliers ?? []).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Enhanced Cost Price Field */}
            <div>
              <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Precio de compra</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="Costo por unidad (opcional)"
                className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
              {selectedProduct && costPrice && Number(costPrice) > 0 && quantity && Number(quantity) > 0 && (
                <div className="mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-700 font-medium">
                    💰 Valor total: S/ {(Number(costPrice) * Number(quantity)).toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            {/* Enhanced Invoice Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Número de factura</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Ej: F-001-12345"
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Fecha de factura</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-emerald-100 border-t border-emerald-500/30">
            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={() => mutation.mutate()} 
                disabled={!canSubmit || mutation.isPending} 
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg border-2 border-emerald-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              >
                {mutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Registrando entrada...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Save className="h-4 w-4" />
                    Registrar entrada
                  </span>
                )}
              </button>
              <button 
                type="button" 
                onClick={() => window.history.back()} 
                className="px-6 py-3 rounded-xl border-2 border-emerald-500/50 text-emerald-600 font-bold bg-white hover:bg-emerald-500 hover:text-white transition-all hover:shadow-lg active:scale-[0.98]"
              >
                <span className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Cancelar
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
