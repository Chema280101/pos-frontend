'use client';

import { useMemo } from 'react';
import { Trash2, Plus, Minus, Package, Scissors, Box, ShoppingBag, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type CartItem, type BusinessUnit } from '@/types/pos';

interface POSCartProps {
  cart: CartItem[];
  onUpdateQuantity: (referenceId: string, itemType: string, employeeId: string | undefined, quantity: number) => void;
  onRemoveItem: (referenceId: string, itemType: string, employeeId: string | undefined) => void;
  unit: BusinessUnit;
}

export function POSCart({ cart, onUpdateQuantity, onRemoveItem, unit }: POSCartProps) {
  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    return { subtotal };
  }, [cart]);

  const getItemIcon = (itemType: string) => {
    switch (itemType) {
      case 'SERVICE': return <Scissors className="h-4 w-4" />;
      case 'PRODUCT': return <Box className="h-4 w-4" />;
      case 'PACKAGE': return <Package className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/98 to-white/95 backdrop-blur-sm shadow-xl">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      {/* Header */}
      <div className="relative z-10 p-4 border-b border-[var(--unit-border)]/30 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5">
        <h3 className="font-bold text-[var(--unit-text)] flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
            <ShoppingBag className="h-4 w-4 text-white" />
          </div>
          Carrito
          {cart.length > 0 && (
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-[var(--unit-accent)] text-[10px] font-bold text-white">
              {cart.length}
            </span>
          )}
        </h3>
      </div>
      
      {/* Cart Items */}
      <div className="relative z-10 max-h-96 overflow-y-auto">
        {cart.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-[var(--unit-accent)]" />
            </div>
            <p className="text-sm text-[var(--unit-text)] mb-4">Carrito vacío</p>
            <div className="space-y-2 text-xs text-[var(--unit-text)]">
              <p>Usa los botones de acceso rápido</p>
              <p>O busca servicios en el catálogo</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[var(--unit-border)]/20">
            {cart.map((item, index) => (
              <div key={`${item.referenceId}-${item.itemType}-${item.employeeId}-${index}`} className="group p-4 transition-all hover:bg-[var(--unit-accent)]/5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10">
                        {getItemIcon(item.itemType)}
                      </div>
                      <h4 className="font-medium text-[var(--unit-text)] group-hover:text-[var(--unit-accent)] transition-colors">{item.name}</h4>
                    </div>
                    <p className="text-sm text-[var(--unit-text-muted)] mb-1">
                      S/ {item.unitPrice.toFixed(2)} × {item.quantity} = <span className="font-semibold text-[var(--unit-accent)]">S/ {(item.unitPrice * item.quantity).toFixed(2)}</span>
                    </p>
                    {item.employeeId && (
                      <p className="text-xs text-[var(--unit-text-muted)] mt-1">
                        <span className="inline-flex items-center gap-1">
                          <UserCircle className="h-3 w-3" />
                          Empleado asignado
                        </span>
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1 rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/90 shadow-sm">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.referenceId, item.itemType, item.employeeId, Math.max(1, item.quantity - 1))}
                        className="p-1.5 text-[var(--unit-text-muted)] hover:bg-[var(--unit-accent)]/10 hover:text-[var(--unit-accent)] rounded-l-xl transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-2 py-1 text-sm font-medium text-[var(--unit-text)] min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.referenceId, item.itemType, item.employeeId, item.quantity + 1)}
                        className="p-1.5 text-[var(--unit-text-muted)] hover:bg-[var(--unit-accent)]/10 hover:text-[var(--unit-accent)] rounded-r-xl transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.referenceId, item.itemType, item.employeeId)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-500/15 rounded-xl transition-all hover:scale-105"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="relative z-10 p-4 border-t border-[var(--unit-border)]/30 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-[var(--unit-text-muted)]">Subtotal:</span>
          <span className="font-bold text-lg text-[var(--unit-accent)] tabular-nums">
            S/ {cartTotals.subtotal.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
