'use client';

import { useState } from 'react';
import { Banknote, CreditCard, ArrowRightLeft, Smartphone, Layers, X, DollarSign } from 'lucide-react';

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
      <div className="w-full max-w-md rounded-t-[calc(var(--unit-border-radius)*1.5)] sm:rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/98 to-white/95 backdrop-blur-sm shadow-xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="h-full w-full bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        {/* Drag handle (mobile) */}
        <div className="relative z-10 mx-auto mb-6 h-1 w-10 rounded-full bg-[var(--unit-text)]/20 sm:hidden" />

        {/* Header */}
        <div className="relative z-10 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--unit-text)]">Cerrar venta</h3>
                <p className="text-2xl font-bold text-emerald-600 tabular-nums">S/ {saleTotal.toFixed(2)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="relative z-20 shrink-0 rounded-xl p-2 text-[var(--unit-text-muted)] transition-all hover:bg-red-500/15 hover:text-red-500 hover:scale-105"
            >
              <X className="h-5 w-5" />
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
        )}

        {/* Actions */}
        {/* Action buttons */}
        <div className="relative z-10 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="relative z-20 flex-1 rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/90 py-3 text-sm font-semibold text-[var(--unit-accent)] transition-all hover:scale-105 hover:border-[var(--unit-accent)]/50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="relative z-20 flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 py-3 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            <Banknote className="h-4 w-4" />
            {isProcessing ? 'Procesando...' : 'Cobrar'}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
