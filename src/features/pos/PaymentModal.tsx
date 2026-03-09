'use client';

import { useState } from 'react';
import { Banknote, CreditCard, ArrowRightLeft, Smartphone, Layers, X, DollarSign, TrendingUp } from 'lucide-react';

type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'DIGITAL_WALLET' | 'MIXED';

interface MixedDetail {
  cash: number;
  card: number;
  transfer: number;
  wallet: number;
}

interface PaymentModalProps {
  saleTotal: number;
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: (method: PaymentMethod, amount: number, detail?: MixedDetail) => void;
}

const methods: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: 'CASH', label: 'Efectivo', icon: Banknote },
  { value: 'CARD', label: 'Tarjeta', icon: CreditCard },
  { value: 'TRANSFER', label: 'Transferencia', icon: ArrowRightLeft },
  { value: 'DIGITAL_WALLET', label: 'Billetera', icon: Smartphone },
  { value: 'MIXED', label: 'Mixto', icon: Layers },
];

export function PaymentModal({ saleTotal, isProcessing, onClose, onConfirm }: PaymentModalProps): JSX.Element {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amountPaid, setAmountPaid] = useState(String(saleTotal));
  const [mixedDetail, setMixedDetail] = useState<MixedDetail>({ cash: 0, card: 0, transfer: 0, wallet: 0 });

  // Calculate change for cash payments
  const calculateChange = () => {
    if (paymentMethod === 'CASH') {
      const paid = Number(amountPaid) || 0;
      return Math.max(0, paid - saleTotal);
    }
    return 0;
  };

  const change = calculateChange();

  const handleConfirm = () => {
    if (paymentMethod === 'MIXED') {
      const sum = mixedDetail.cash + mixedDetail.card + mixedDetail.transfer + mixedDetail.wallet;
      if (sum <= 0) return;
      onConfirm(paymentMethod, sum, mixedDetail);
    } else {
      const amount = Number(amountPaid);
      if (amount <= 0) return;
      onConfirm(paymentMethod, amount);
    }
  };

  const mixedInputClass = 'w-full rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/90 px-4 py-3 text-sm text-[var(--unit-text)] tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all placeholder:text-[var(--unit-text-muted)]/50';

  return (
    <div className="fixed inset-0 z-10 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-md p-0 sm:p-4">
      <div className="w-full max-w-md rounded-t-[calc(var(--unit-border-radius)*1.5)] sm:rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto relative overflow-hidden">
        {/* Glassmorphism overlay pattern - Consistente con Modal.tsx */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='20' cy='20' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        {/* Mobile handle - Consistente con Modal.tsx */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--unit-text)]/20 sm:hidden" />

        {/* Enhanced Header - Consistente con ClientModals */}
        <div className="relative mb-6">
          {/* Background gradient for header - Consistente con Modal.tsx */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--unit-accent)]/20 to-transparent"></div>
          
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--unit-text)]">Cerrar venta</h3>
                <p className="text-2xl font-bold text-[var(--unit-accent)] tabular-nums">S/ {saleTotal.toFixed(2)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="relative z-10 shrink-0 rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)]/50 p-2 text-[var(--unit-text-muted)] transition-all duration-200 hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10 hover:text-[var(--unit-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Method selector */}
        <div className="relative z-10 mb-5">
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[var(--unit-text-muted)]">Método de pago</label>
          <div className="grid grid-cols-5 gap-1.5">
            {methods.map((m) => {
              const active = paymentMethod === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPaymentMethod(m.value)}
                  className={`relative z-20 flex flex-col items-center gap-1 rounded-xl border-2 p-2.5 text-[10px] font-semibold transition-all hover:scale-105 ${
                    active
                      ? 'border-[var(--unit-accent)] bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] text-white shadow-lg'
                      : 'border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/90 text-[var(--unit-text-muted)] hover:border-[var(--unit-accent)]/50 hover:text-[var(--unit-accent)]'
                  }`}
                >
                  <m.icon className="h-4 w-4" />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount inputs */}
        <div className="relative z-10">
          {paymentMethod === 'MIXED' ? (
            <div className="mb-6 space-y-3">
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[var(--unit-text-muted)]">Efectivo</label>
                <input type="number" min={0} step={0.01} value={mixedDetail.cash || ''} onChange={(e) => setMixedDetail((d) => ({ ...d, cash: Number(e.target.value) || 0 }))} className={mixedInputClass} placeholder="0.00" />
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[var(--unit-text-muted)]">Tarjeta</label>
                <input type="number" min={0} step={0.01} value={mixedDetail.card || ''} onChange={(e) => setMixedDetail((d) => ({ ...d, card: Number(e.target.value) || 0 }))} className={mixedInputClass} placeholder="0.00" />
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[var(--unit-text-muted)]">Transferencia</label>
                <input type="number" min={0} step={0.01} value={mixedDetail.transfer || ''} onChange={(e) => setMixedDetail((d) => ({ ...d, transfer: Number(e.target.value) || 0 }))} className={mixedInputClass} placeholder="0.00" />
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[var(--unit-text-muted)]">Billetera</label>
                <input type="number" min={0} step={0.01} value={mixedDetail.wallet || ''} onChange={(e) => setMixedDetail((d) => ({ ...d, wallet: Number(e.target.value) || 0 }))} className={mixedInputClass} placeholder="0.00" />
              </div>
              <div className="flex justify-between text-sm font-semibold text-[var(--unit-text)]">
                <span>Suma</span>
                <span className="font-heading tabular-nums">S/ {(mixedDetail.cash + mixedDetail.card + mixedDetail.transfer + mixedDetail.wallet).toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[var(--unit-text-muted)]">Monto recibido</label>
                <input
                  type="number"
                  min={0}
                  step={0.10}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full rounded-[var(--unit-radius-sm)] border-2 border-[var(--unit-border)] bg-[var(--unit-surface)] px-4 py-3 text-center font-heading text-xl text-[var(--unit-text-muted)] tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]"
                />
              </div>

              {/* Enhanced Change display - Consistente con sistema */}
              {paymentMethod === 'CASH' && change > 0 && (
                <div className="mb-6 p-4 rounded-xl border-2 border-[var(--unit-accent)]/30 bg-gradient-to-br from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--unit-text)]">Vuelto</p>
                        <p className="text-xs text-[var(--unit-text-muted)]">Cantidad a devolver</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[var(--unit-accent)] tabular-nums">S/ {change.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Enhanced Action Buttons - Consistente con ClientModals */}
          <div className="px-6 py-4 bg-gradient-to-r from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] border-t border-[var(--unit-border)]/30 -mx-6 -mb-6 mt-6">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-xl border-2 border-[var(--unit-accent)]/50 text-[var(--unit-accent)] font-bold bg-[var(--unit-surface)] hover:bg-[var(--unit-accent)] hover:text-white transition-all hover:shadow-lg active:scale-[0.98]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white font-bold shadow-lg border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <TrendingUp className="h-4 w-4 animate-spin" />
                    Procesando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Cobrar
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
