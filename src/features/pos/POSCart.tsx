'use client';

import { useMemo } from 'react';
import { Trash2, Plus, Minus, Package, Scissors, Box, ShoppingBag, UserCircle, Clock, AlertCircle } from 'lucide-react';
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
    <div className="rounded-unit-lg border border-[var(--unit-border)]/30 bg-[var(--unit-surface-elevated)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--unit-border)]/30">
        <h3 className="font-bold text-[var(--unit-text)] flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-unit bg-[var(--unit-accent)]">
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
        {/* Mensaje de aprobaciones pendientes */}
        {cart.some(item => item.requiresApproval) && (
          <div className="mx-4 mt-4 p-3 rounded-unit bg-amber-50 border border-amber-200/50">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Servicios pendientes de aprobación</p>
                <p className="text-amber-700 mt-1">Los servicios marcados como "Pendiente" deben ser aprobados por un administrador antes de poder crear la venta.</p>
              </div>
            </div>
          </div>
        )}
        
        {cart.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-unit-lg bg-[var(--unit-accent)]/10 flex items-center justify-center">
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
                      <div className="flex h-6 w-6 items-center justify-center rounded-unit bg-[var(--unit-accent)]/10">
                        {getItemIcon(item.itemType)}
                      </div>
                      <h4 className="font-medium text-[var(--unit-text)] group-hover:text-[var(--unit-accent)] transition-colors">{item.name}</h4>
                      
                      {/* Indicador de aprobación pendiente */}
                      {item.requiresApproval && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100/80 border border-amber-200/50">
                          <Clock className="h-3 w-3 text-amber-600" />
                          <span className="text-xs font-medium text-amber-700">Pendiente</span>
                        </div>
                      )}
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
                    <div className="flex items-center gap-0.5 rounded-unit border border-[var(--unit-border)]/60 bg-[var(--unit-surface)] shadow-unit-sm">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.referenceId, item.itemType, item.employeeId, Math.max(1, item.quantity - 1))}
                        className="h-8 w-8 flex items-center justify-center text-[var(--unit-text-muted)] hover:bg-[var(--unit-accent)]/10 hover:text-[var(--unit-accent)] rounded-l-xl transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                        disabled={item.quantity <= 1}
                        aria-label="Disminuir cantidad"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-2 py-1 text-sm font-semibold text-[var(--unit-text)] min-w-[2.2rem] text-center tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.referenceId, item.itemType, item.employeeId, item.quantity + 1)}
                        className="h-8 w-8 flex items-center justify-center text-[var(--unit-text-muted)] hover:bg-[var(--unit-accent)]/10 hover:text-[var(--unit-accent)] rounded-r-xl transition-colors"
                        aria-label="Aumentar cantidad"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.referenceId, item.itemType, item.employeeId)}
                      className="p-2 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-unit transition-all md:opacity-0 md:group-hover:opacity-100"
                      aria-label="Eliminar producto"
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
      <div className="p-4 border-t border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] rounded-b-2xl">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-[var(--unit-text-muted)]">Subtotal Carrito:</span>
          <span className="font-bold text-xl text-[var(--unit-accent)] tabular-nums">
            S/ {cartTotals.subtotal.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
