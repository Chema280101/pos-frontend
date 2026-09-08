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
    <div className="min-h-screen bg-[var(--unit-surface)]">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Top Header */}
        <div className="border-b border-[var(--unit-border)]/40 pb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] text-xs font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--unit-accent)] animate-pulse" />
              Inventario & Insumos
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--unit-text)] tracking-tight">
            Registrar Uso Interno
          </h1>
          <p className="text-xs sm:text-sm text-[var(--unit-text-muted)]">
            Salida de productos e insumos para consumo operativo y servicios
          </p>
        </div>

        {/* Form Container */}
        <div className="rounded-unit-lg border border-[var(--unit-border)]/60 bg-[var(--unit-surface-elevated)] shadow-unit overflow-hidden">
          {/* Form Header */}
          <div className="bg-[var(--unit-surface)] px-6 py-4 border-b border-[var(--unit-border)]/40">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-unit bg-amber-500/10 text-amber-600 font-bold">
                <Home className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--unit-text)]">Datos del Consumo</h2>
                <p className="text-xs text-[var(--unit-text-muted)]">Selecciona el producto y especifica el motivo</p>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {mutation.error && (
            <div className="mx-6 mt-4 rounded-unit border border-rose-500/30 bg-rose-500/10 p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-rose-600" />
                <p className="text-xs font-semibold text-rose-600">
                  Error al registrar el uso interno. Por favor verifica el stock disponible.
                </p>
              </div>
            </div>
          )}

          {/* Form Content */}
          <div className="p-6 space-y-5">
            {/* Product Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--unit-text-muted)] uppercase tracking-wider">
                Producto *
              </label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full rounded-unit border border-[var(--unit-border)]/60 px-3.5 py-2.5 text-xs sm:text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/40 transition-all"
              >
                <option value="">Seleccionar producto...</option>
                {(products ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (stock: {p.stock} {p.measureUnit ?? ''})
                  </option>
                ))}
              </select>
              {selectedProduct && (
                <p className="text-[11px] text-[var(--unit-text-muted)] pl-1">
                  Stock actual disponible: <span className="font-bold text-[var(--unit-accent)]">{selectedProduct.stock} {selectedProduct.measureUnit ?? 'unidades'}</span>
                </p>
              )}
            </div>

            {/* Quantity Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--unit-text-muted)] uppercase tracking-wider">
                Cantidad a Consumir *
              </label>
              <input
                type="number"
                min="1"
                max={selectedProduct ? selectedProduct.stock : undefined}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ej. 1"
                className="w-full rounded-unit border border-[var(--unit-border)]/60 px-3.5 py-2.5 text-xs sm:text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/40 transition-all"
              />
            </div>

            {/* Reason Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--unit-text-muted)] uppercase tracking-wider">
                Motivo / Justificación *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Ej. Consumo en cabina estética, limpieza de sillones, prueba técnica..."
                className="w-full rounded-unit border border-[var(--unit-border)]/60 px-3.5 py-2.5 text-xs sm:text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/40 transition-all resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-3 border-t border-[var(--unit-border)]/30">
              <button 
                type="button" 
                onClick={() => mutation.mutate()} 
                disabled={!canSubmit || mutation.isPending} 
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-unit bg-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/90 text-white text-xs sm:text-sm font-bold shadow-unit transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex-1"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Registrando uso...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Registrar Uso Interno</span>
                  </>
                )}
              </button>
              <button 
                type="button" 
                onClick={() => window.history.back()} 
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-xs sm:text-sm font-semibold text-[var(--unit-text)] bg-[var(--unit-surface)] hover:bg-[var(--unit-surface-elevated)] transition-all shadow-unit-sm"
              >
                <X className="h-4 w-4" />
                <span>Cancelar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
