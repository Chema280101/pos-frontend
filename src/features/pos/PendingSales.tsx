'use client';

import { Receipt, Banknote, X } from 'lucide-react';

interface PendingSale {
  id: string;
  saleNumber: string;
  total: number;
  [key: string]: unknown;
}

interface PendingSalesProps {
  sales: PendingSale[];
  isLoading: boolean;
  onCollect: (sale: PendingSale) => void;
  onCancel?: (sale: PendingSale) => void;
  userRole?: string; // Para mostrar/ocultar botón de cancelación
}

export function PendingSales({ sales, isLoading, onCollect, onCancel, userRole }: PendingSalesProps): JSX.Element {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/98 to-white/95 backdrop-blur-sm shadow-xl p-6">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/3 to-[var(--unit-primary)]/3 rounded-2xl"></div>
      
      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-[var(--unit-text)]">Pendientes</h2>
            <p className="text-sm text-[var(--unit-text-muted)]">Ventas esperando cobro</p>
          </div>
          {sales.length > 0 && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
              <span className="text-sm font-bold text-white">{sales.length}</span>
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="relative">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
              <div className="absolute inset-0 h-6 w-6 animate-ping rounded-full bg-emerald-500/20"></div>
            </div>
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2"></div>
            <p className="text-sm text-[var(--unit-text-muted)]">Sin ventas pendientes</p>
            <p className="text-xs text-[var(--unit-text-muted)] mt-1">Todas las ventas están cobradas</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {sales.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-3 rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/90 p-4 transition-all hover:shadow-lg hover:scale-[1.02] hover:border-emerald-500/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/20">
                  <Receipt className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--unit-text)]">{s.saleNumber}</p>
                  <p className="mt-1 text-lg font-bold text-emerald-600 tabular-nums">
                    S/ {s.total.toFixed(2)}
                  </p>  
                </div>
                <div className="flex items-center gap-2">
                  {onCancel && userRole === 'ADMIN' && (
                    <button
                      type="button"
                      onClick={() => onCancel(s)}
                      className="relative flex items-center gap-2 rounded-xl border-2 border-red-500/50 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-600 transition-all hover:bg-red-500/20 hover:scale-[1.02] active:scale-[0.98] group"
                      title="Cancelar venta"
                    >
                      <X className="h-4 w-4" />
                      <span className="hidden sm:inline">Cancelar</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onCollect(s)}
                    className="relative flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] group"
                  >
                    <Banknote className="h-4 w-4" />
                    <span>Cobrar</span>
                    <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
