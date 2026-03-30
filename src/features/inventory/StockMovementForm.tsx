import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Home, Save, X, AlertCircle, Loader2, Package, TrendingDown, FileText } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  stock: number;
  measureUnit: string | null;
  unit: string;
}

export function StockMovementForm(): JSX.Element {
  const queryClient = useQueryClient();
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  const { data: products } = useQuery({
    queryKey: ['inventory-products'],
    queryFn: async (): Promise<Product[]> => {
      const { data } = await api.get<{ data: Product[] }>('/api/inventory/products');
      return data.data; // Extract array from paginated response
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/inventory/movements/internal-use', {
        productId,
        quantity: Number(quantity),
        reason: reason.trim(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      setProductId('');
      setQuantity('');
      setReason('');
    },
  });

  const selectedProduct = products?.find((p) => p.id === productId);
  const canSubmit = productId && Number(quantity) > 0 && reason.trim() && selectedProduct && selectedProduct.stock >= Number(quantity);

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
            <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></div>
            <span className="text-sm font-medium text-[var(--unit-text)]">
              Movimiento de inventario
            </span>
          </div>
          <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">
            Uso Interno
          </h1>
          <p className="text-[var(--unit-text-muted)]">
            Registra el consumo interno de productos y servicios
          </p>
        </div>

        {/* Enhanced Form Container */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-orange-500/50 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm shadow-2xl">
          {/* Form Header */}
          <div className="relative bg-gradient-to-r from-orange-500/10 to-orange-600/10 px-6 py-4 border-b border-orange-500/30">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--unit-text)]">Información de uso interno</h2>
                <p className="text-sm text-[var(--unit-text-muted)]">Registra el consumo del producto</p>
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
                  Error al registrar uso
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
                className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
              >
                <option value="">Seleccionar producto...</option>
                {(products ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (stock: {p.stock} {p.measureUnit ?? ''})
                  </option>
                ))}
              </select>
              {selectedProduct && (
                <div className="mt-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-700 font-medium">
                    📦 Stock disponible: {selectedProduct.stock} {selectedProduct.measureUnit || 'unidades'}
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
                placeholder="Ej: 5"
                className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
              />
              {selectedProduct && quantity && Number(quantity) > 0 && (
                <>
                  {Number(quantity) > selectedProduct.stock && (
                    <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-700 font-medium flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        ❌ Stock insuficiente. Máximo disponible: {selectedProduct.stock} {selectedProduct.measureUnit || 'unidades'}
                      </p>
                    </div>
                  )}
                  {Number(quantity) <= selectedProduct.stock && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-700 font-medium">
                        📉 Nuevo stock: {selectedProduct.stock - Number(quantity)} {selectedProduct.measureUnit || 'unidades'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Enhanced Reason Field */}
            <div>
              <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Motivo del uso *</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe el motivo del consumo interno..."
                className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all resize-none"
                rows={4}
              />
              <p className="mt-2 text-xs text-[var(--unit-text-muted)] flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Ej: Uso en masaje - cita completada, Consumo en barbería, Mantenimiento de equipo, etc.
              </p>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-orange-100 border-t border-orange-500/30">
            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={() => mutation.mutate()} 
                disabled={!canSubmit || mutation.isPending} 
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold shadow-lg border-2 border-orange-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              >
                {mutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Registrando uso...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Save className="h-4 w-4" />
                    Registrar uso interno
                  </span>
                )}
              </button>
              <button 
                type="button" 
                onClick={() => window.history.back()} 
                className="px-6 py-3 rounded-xl border-2 border-orange-500/50 text-orange-600 font-bold bg-white hover:bg-orange-500 hover:text-white transition-all hover:shadow-lg active:scale-[0.98]"
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
