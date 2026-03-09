'use client';

import { useMemo } from 'react';
import { Trash2, Plus, Minus, Package, Scissors, Box, UserCircle, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CartItem, BusinessUnit } from '@/types/pos';

interface CartManagerProps {
  cart: CartItem[];
  onUpdateQuantity: (referenceId: string, itemType: string, employeeId: string | undefined, quantity: number) => void;
  onRemoveItem: (referenceId: string, itemType: string, employeeId: string | undefined) => void;
  unit: BusinessUnit;
  discountAmount: number;
  discountReason: string;
  onDiscountChange: (amount: number, reason: string) => void;
  selectedCustomer: { id: string; name: string; phone: string } | null;
  onCustomerSelect: (customer: { id: string; name: string; phone: string } | null) => void;
}

export function CartManager({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  unit,
  discountAmount,
  discountReason,
  onDiscountChange,
  selectedCustomer,
  onCustomerSelect
}: CartManagerProps) {
  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const total = Math.max(0, subtotal - discountAmount);
    return { subtotal, total };
  }, [cart, discountAmount]);

  const getItemIcon = (itemType: string) => {
    switch (itemType) {
      case 'SERVICE': return <Scissors className="h-4 w-4" />;
      case 'PRODUCT': return <Box className="h-4 w-4" />;
      case 'PACKAGE': return <Package className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getItemTypeLabel = (itemType: string) => {
    switch (itemType) {
      case 'SERVICE': return 'Servicio';
      case 'PRODUCT': return 'Producto';
      case 'PACKAGE': return 'Paquete';
      default: return 'Item';
    }
  };

  return (
    <div className="space-y-4">
      {/* Customer Selection */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/98 to-white/95 backdrop-blur-sm shadow-xl p-4">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/3 to-[var(--unit-primary)]/3 rounded-2xl"></div>
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <UserCircle className="h-5 w-5 text-[var(--unit-accent)]" />
            <span className="text-sm font-semibold text-[var(--unit-text)]">Cliente</span>
          </div>
          
          {selectedCustomer ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--unit-surface)] border border-[var(--unit-border)]/30">
              <div>
                <p className="text-sm font-medium text-[var(--unit-text)]">{selectedCustomer.name}</p>
                <p className="text-xs text-[var(--unit-text-muted)]">{selectedCustomer.phone}</p>
              </div>
              <button
                type="button"
                onClick={() => onCustomerSelect(null)}
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div className="text-center py-3">
              <p className="text-sm text-[var(--unit-text-muted)]">Sin cliente seleccionado</p>
              <button
                type="button"
                onClick={() => onCustomerSelect(null)} // TODO: Implementar búsqueda de clientes
                className="text-xs text-[var(--unit-accent)] hover:text-[var(--unit-accent)]/80 transition-colors mt-1"
              >
                Buscar cliente
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/98 to-white/95 backdrop-blur-sm shadow-xl p-4">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/3 to-[var(--unit-primary)]/3 rounded-2xl"></div>
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--unit-accent)]/10">
              <Package className="h-4 w-4 text-[var(--unit-accent)]" />
            </div>
            <h3 className="text-lg font-bold text-[var(--unit-text)]">Carrito</h3>
            <span className="ml-auto text-sm text-[var(--unit-text-muted)]">
              {cart.length} {cart.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🛒</div>
              <p className="text-sm text-[var(--unit-text-muted)]">Carrito vacío</p>
              <p className="text-xs text-[var(--unit-text-muted)] mt-1">Agrega items para comenzar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div
                  key={`${item.referenceId}-${item.employeeId || 'no-emp'}-${index}`}
                  className="flex items-center gap-3 rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/90 p-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--unit-accent)]/10">
                    {getItemIcon(item.itemType)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--unit-text)] truncate">{item.name}</p>
                    <p className="text-xs text-[var(--unit-text-muted)]">
                      {getItemTypeLabel(item.itemType)}
                      {item.employeeId && ` • Empleado: ${item.employeeId}`}
                    </p>
                    <p className="text-sm font-bold text-[var(--unit-accent)]">
                      S/ {item.unitPrice.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.referenceId, item.itemType, item.employeeId, Math.max(1, item.quantity - 1))}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--unit-border)]/50 bg-white/80 hover:bg-[var(--unit-accent)] hover:text-white transition-all"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    
                    <span className="text-sm font-medium text-[var(--unit-text)] w-8 text-center">
                      {item.quantity}
                    </span>
                    
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.referenceId, item.itemType, item.employeeId, item.quantity + 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--unit-border)]/50 bg-white/80 hover:bg-[var(--unit-accent)] hover:text-white transition-all"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.referenceId, item.itemType, item.employeeId)}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Discount Section */}
      {cart.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/98 to-white/95 backdrop-blur-sm shadow-xl p-4">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/3 to-orange-500/3 rounded-2xl"></div>
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <Percent className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-semibold text-[var(--unit-text)]">Descuento</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[var(--unit-text-muted)] block mb-1">Monto (S/)</label>
                <input
                  type="number"
                  min="0"
                  max={cartTotals.subtotal}
                  step="0.01"
                  value={discountAmount || ''}
                  onChange={(e) => {
                    const amount = parseFloat(e.target.value) || 0;
                    onDiscountChange(amount, discountReason);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--unit-border)]/50 bg-white/80 text-[var(--unit-text)] focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="text-xs text-[var(--unit-text-muted)] block mb-1">Razón</label>
                <input
                  type="text"
                  value={discountReason || ''}
                  onChange={(e) => onDiscountChange(discountAmount, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--unit-border)]/50 bg-white/80 text-[var(--unit-text)] focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  placeholder="Motivo del descuento"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Totals */}
      {cart.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/98 to-white/95 backdrop-blur-sm shadow-xl p-4">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/3 to-green-500/3 rounded-2xl"></div>
          
          <div className="relative space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--unit-text-muted)]">Subtotal:</span>
              <span className="text-sm font-medium text-[var(--unit-text)]">
                S/ {cartTotals.subtotal.toFixed(2)}
              </span>
            </div>
            
            {discountAmount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--unit-text-muted)]">Descuento:</span>
                <span className="text-sm font-medium text-amber-600">
                  -S/ {discountAmount.toFixed(2)}
                </span>
              </div>
            )}
            
            <div className="border-t border-[var(--unit-border)]/50 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-[var(--unit-text)]">Total:</span>
                <span className="text-lg font-bold text-emerald-600">
                  S/ {cartTotals.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
