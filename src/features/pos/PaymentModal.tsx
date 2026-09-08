'use client';

import { useState, useEffect } from 'react';
import { Banknote, CreditCard, ArrowRightLeft, Smartphone, Layers, X, DollarSign, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'DIGITAL_WALLET' | 'MIXED';

export interface MixedDetail {
  cash: number;
  card: number;
  transfer: number;
  wallet: number;
}

export interface PaymentModalProps {
  saleTotal: number;
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: (method: PaymentMethod, amount: number, detail?: MixedDetail) => void;
}

const methods: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: 'CASH', label: 'Efectivo', icon: Banknote },
  { value: 'CARD', label: 'Tarjeta', icon: CreditCard },
  { value: 'TRANSFER', label: 'Transfer.', icon: ArrowRightLeft },
  { value: 'DIGITAL_WALLET', label: 'Billetera', icon: Smartphone },
  { value: 'MIXED', label: 'Mixto', icon: Layers },
];

export function PaymentModal({ saleTotal, isProcessing, onClose, onConfirm }: PaymentModalProps): JSX.Element {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amountPaid, setAmountPaid] = useState(String(saleTotal));
  const [mixedDetail, setMixedDetail] = useState<MixedDetail>({ cash: 0, card: 0, transfer: 0, wallet: 0 });

  // Reset form when modal opens (saleTotal changes)
  useEffect(() => {
    setPaymentMethod('CASH');
    setAmountPaid(String(saleTotal));
    setMixedDetail({ cash: 0, card: 0, transfer: 0, wallet: 0 });
  }, [saleTotal]);

  // Quick cash suggestion amounts
  const quickAmounts = [
    saleTotal,
    Math.ceil(saleTotal / 10) * 10,
    Math.ceil(saleTotal / 50) * 50 > saleTotal ? Math.ceil(saleTotal / 50) * 50 : saleTotal + 50,
    100 > saleTotal ? 100 : Math.ceil(saleTotal / 100) * 100,
  ].filter((v, idx, arr) => arr.indexOf(v) === idx && v >= saleTotal).slice(0, 4);

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

  const mixedInputClass =
    'w-full rounded-unit border border-[var(--unit-border)]/60 bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface-elevated)] focus:bg-[var(--unit-surface-elevated)]/70 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800 px-3.5 py-2 text-sm text-[var(--unit-text)] tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/40 focus:border-[var(--unit-accent)] transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-200" 
        onClick={onClose} 
      />

      {/* Modal Dialog Card */}
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-unit-lg border border-[var(--unit-border)]/60 bg-[var(--unit-surface-elevated)] shadow-unit-lg p-6 sm:p-7 relative z-10 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Top ambient glow */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[var(--unit-accent)]/40 to-transparent pointer-events-none" />

        {/* Mobile handle */}
        <div className="pt-1 pb-3 flex justify-center sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-[var(--unit-border)]" />
        </div>

        {/* Header */}
        <div className="relative mb-5 flex items-start justify-between gap-4 border-b border-[var(--unit-border)]/30 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-unit bg-[var(--unit-accent)] text-white shadow-unit shadow-[var(--unit-accent)]/20 shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading text-lg sm:text-xl font-bold text-[var(--unit-text)]">Cobrar Venta</h3>
              <p className="text-xl sm:text-2xl font-bold text-[var(--unit-accent)] tabular-nums">
                S/ {saleTotal.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-unit border border-[var(--unit-border)]/60/80 dark:border-zinc-700/80 bg-[var(--unit-surface)]/50 hover:bg-[var(--unit-surface-elevated)] p-2 text-[var(--unit-text-muted)] hover:text-[var(--unit-text)] transition-all active:scale-95"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Method selector */}
        <div className="mb-5 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--unit-text)]">
            Método de pago
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {methods.map((m) => {
              const active = paymentMethod === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(m.value);
                    if (m.value !== 'MIXED') {
                      setAmountPaid(String(saleTotal));
                    }
                  }}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-unit border p-2.5 text-[11px] font-semibold transition-all active:scale-95',
                    active
                      ? 'border-[var(--unit-accent)] bg-[var(--unit-accent)] text-white shadow-unit shadow-[var(--unit-accent)]/20'
                      : 'border-[var(--unit-border)]/60/70 bg-[var(--unit-surface)] hover:bg-slate-100 text-[var(--unit-text-muted)] dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:bg-zinc-800'
                  )}
                >
                  <m.icon className="h-4 w-4" />
                  <span className="truncate w-full text-center">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount inputs */}
        <div className="space-y-4">
          {paymentMethod === 'MIXED' ? (
            <div className="space-y-3 p-4 rounded-unit border border-[var(--unit-border)]/60 bg-[var(--unit-surface)]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--unit-text-muted)]">Efectivo</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={mixedDetail.cash || ''}
                    onChange={(e) => setMixedDetail((d) => ({ ...d, cash: Number(e.target.value) || 0 }))}
                    className={mixedInputClass}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--unit-text-muted)]">Tarjeta</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={mixedDetail.card || ''}
                    onChange={(e) => setMixedDetail((d) => ({ ...d, card: Number(e.target.value) || 0 }))}
                    className={mixedInputClass}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--unit-text-muted)]">Transferencia</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={mixedDetail.transfer || ''}
                    onChange={(e) => setMixedDetail((d) => ({ ...d, transfer: Number(e.target.value) || 0 }))}
                    className={mixedInputClass}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--unit-text-muted)]">Billetera</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={mixedDetail.wallet || ''}
                    onChange={(e) => setMixedDetail((d) => ({ ...d, wallet: Number(e.target.value) || 0 }))}
                    className={mixedInputClass}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-[var(--unit-border)]/60 text-sm font-semibold text-[var(--unit-text)]">
                <span>Total Mixto:</span>
                <span
                  className={cn(
                    'tabular-nums font-bold text-base',
                    mixedDetail.cash + mixedDetail.card + mixedDetail.transfer + mixedDetail.wallet === saleTotal
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  )}
                >
                  S/ {(mixedDetail.cash + mixedDetail.card + mixedDetail.transfer + mixedDetail.wallet).toFixed(2)}
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--unit-text)]">
                  Monto recibido (S/)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-[var(--unit-text-muted)]">
                    S/
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full rounded-unit border border-[var(--unit-border)]/60 bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface-elevated)] focus:bg-[var(--unit-surface-elevated)]/70 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800 pl-11 pr-4 py-3 text-center font-heading text-2xl font-bold text-[var(--unit-text)] tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/40 focus:border-[var(--unit-accent)] transition-all"
                  />
                </div>
              </div>

              {/* Quick Cash Suggestions */}
              {paymentMethod === 'CASH' && (
                <div className="flex gap-2">
                  {quickAmounts.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setAmountPaid(String(q))}
                      className="flex-1 py-1.5 px-2 rounded-unit border border-[var(--unit-border)]/60/80 bg-[var(--unit-surface)] hover:bg-slate-100 dark:bg-zinc-800/70 dark:hover:bg-zinc-800 text-xs font-semibold text-[var(--unit-text)] dark:text-zinc-200 transition-all active:scale-95 tabular-nums"
                    >
                      S/ {q.toFixed(0)}
                    </button>
                  ))}
                </div>
              )}

              {/* Change badge */}
              {paymentMethod === 'CASH' && (
                <div
                  className={cn(
                    'p-4 rounded-unit border flex items-center justify-between transition-all',
                    change > 0
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : 'border-[var(--unit-border)]/60 dark:border-zinc-800 bg-[var(--unit-surface)] dark:bg-zinc-800/40'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle
                      className={cn('h-5 w-5', change > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-zinc-500')}
                    />
                    <div>
                      <p className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Vuelto a devolver</p>
                      <p className="text-xs text-[var(--unit-text-muted)]">
                        {change > 0 ? 'Entrega el cambio correspondiente' : 'Pago exacto o pendiente'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-xl font-bold tabular-nums', change > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--unit-text)] dark:text-zinc-200')}>
                      S/ {change.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-unit border border-[var(--unit-border)]/60/80 dark:border-zinc-700/80 text-[var(--unit-text)] dark:text-zinc-200 font-semibold bg-slate-100/90 hover:bg-slate-200/90 dark:bg-zinc-800/90 dark:hover:bg-zinc-700/90 transition-all active:scale-[0.98] text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing || (paymentMethod === 'CASH' && Number(amountPaid) < saleTotal)}
              className="flex-1 px-4 py-3 rounded-unit bg-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/90 text-white font-semibold shadow-unit shadow-[var(--unit-accent)]/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 text-sm flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Banknote className="h-4 w-4" />
                  Confirmar Cobro
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
