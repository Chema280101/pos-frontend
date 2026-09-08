'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Plus, Lock, Unlock, AlertCircle, CreditCard, X, Loader2, CheckCircle } from 'lucide-react';
import type { Client } from '../../types/client';
import { StackedModal } from '@/components/ui';

export interface ClientModalsProps {
  creditModal: boolean;
  setCreditModal: (open: boolean) => void;
  blockModal: boolean;
  setBlockModal: (open: boolean) => void;
  selectedClient: Client | null;
  setSelectedClient: (client: Client | null) => void;
}

export function ClientModals({ 
  creditModal, 
  setCreditModal, 
  blockModal, 
  setBlockModal, 
  selectedClient, 
  setSelectedClient 
}: ClientModalsProps): JSX.Element {
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const queryClient = useQueryClient();

  // Credit mutation
  const creditMutation = useMutation({
    mutationFn: (data: { clientId: number; amount: number; reason: string }) => 
      api.post('/clients/credit', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setCreditModal(false);
      setCreditAmount('');
      setCreditReason('');
      setSelectedClient(null);
    },
  });

  // Block/Unblock mutations
  const blockMutation = useMutation({
    mutationFn: (data: { clientId: number; reason: string }) => 
      api.post('/clients/block', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setBlockModal(false);
      setBlockReason('');
      setSelectedClient(null);
    },
  });

  const unblockMutation = useMutation({
    mutationFn: (clientId: number) => 
      api.post(`/clients/${clientId}/unblock`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setBlockModal(false);
      setBlockReason('');
      setSelectedClient(null);
    },
  });

  const handleCreditSubmit = () => {
    if (!creditAmount || Number(creditAmount) <= 0 || !selectedClient) return;
    
    creditMutation.mutate({
      clientId: Number(selectedClient.id),
      amount: Number(creditAmount),
      reason: creditReason,
    });
  };

  const handleBlockSubmit = () => {
    if (!selectedClient) return;
    
    if (selectedClient.isBlocked) {
      unblockMutation.mutate(Number(selectedClient.id));
    } else {
      if (!blockReason.trim()) {
        return;
      }
      blockMutation.mutate({
        clientId: Number(selectedClient.id),
        reason: blockReason,
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (creditModal) {
          setCreditModal(false);
          setCreditAmount('');
          setCreditReason('');
          setSelectedClient(null);
        }
        if (blockModal) {
          setBlockModal(false);
          setBlockReason('');
          setSelectedClient(null);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [creditModal, creditAmount, creditReason, selectedClient, blockModal, blockReason, setCreditModal, setBlockModal, setSelectedClient]);

  return (
    <>
      {/* Enhanced Credit Modal */}
      <StackedModal
        open={creditModal}
        onClose={() => {
          setCreditModal(false);
          setCreditAmount('');
          setCreditReason('');
          setSelectedClient(null);
        }}
        title="Agregar Crédito"
        description={selectedClient ? `Cliente: ${selectedClient.name}` : undefined}
        modalId="credit-modal"
        modalName="Agregar Crédito"
        headerIcon={<CreditCard className="h-5 w-5" />}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--unit-text)] dark:text-zinc-300">
              Monto a favor (S/) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[var(--unit-text-muted)] dark:text-zinc-400">
                S/
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-unit border border-[var(--unit-border)]/60 dark:border-zinc-700 bg-slate-50/80 hover:bg-[var(--unit-surface-elevated)] focus:bg-[var(--unit-surface-elevated)] dark:bg-zinc-800/70 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800 pl-11 pr-4 py-2.5 text-sm text-[var(--unit-text)] dark:text-zinc-100 font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/40 focus:border-[var(--unit-accent)] transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--unit-text)] dark:text-zinc-300">
              Motivo del crédito <span className="text-red-500">*</span>
            </label>
            <textarea
              value={creditReason}
              onChange={(e) => setCreditReason(e.target.value)}
              placeholder="Describe el motivo o concepto del saldo a favor..."
              className="w-full rounded-unit border border-[var(--unit-border)]/60 dark:border-zinc-700 px-4 py-2.5 text-sm text-[var(--unit-text)] dark:text-zinc-100 bg-slate-50/80 hover:bg-[var(--unit-surface-elevated)] focus:bg-[var(--unit-surface-elevated)] dark:bg-zinc-800/70 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/40 focus:border-[var(--unit-accent)] transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500 resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-3">
            <button 
              type="button" 
              onClick={() => { setCreditModal(false); setCreditAmount(''); setCreditReason(''); setSelectedClient(null); }} 
              className="flex-1 px-4 py-2.5 rounded-unit border border-[var(--unit-border)]/60/80 dark:border-zinc-700/80 text-[var(--unit-text)] dark:text-zinc-200 font-semibold bg-slate-100/90 hover:bg-slate-200/90 dark:bg-zinc-800/90 dark:hover:bg-zinc-700/90 transition-all active:scale-[0.98] text-sm"
            >
              Cancelar
            </button>
            <button 
              type="button" 
              onClick={handleCreditSubmit}
              disabled={!creditAmount || Number(creditAmount) <= 0 || creditMutation.isPending}
              className="flex-1 px-4 py-2.5 rounded-unit bg-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/90 text-white font-semibold shadow-unit shadow-[var(--unit-accent)]/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
            >
              {creditMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Agregando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Agregar Crédito
                </>
              )}
            </button>
          </div>
        </div>
      </StackedModal>

      {/* Enhanced Block Modal */}
      <StackedModal
        open={blockModal}
        onClose={() => {
          setBlockModal(false);
          setBlockReason('');
          setSelectedClient(null);
        }}
        title={selectedClient?.isBlocked ? 'Desbloquear Cliente' : 'Bloquear Cliente'}
        description={selectedClient ? `Cliente: ${selectedClient.name}` : undefined}
        modalId="block-modal"
        modalName="Bloquear Cliente"
        headerIcon={selectedClient?.isBlocked ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
      >
        <div className="space-y-4">
          {!selectedClient?.isBlocked ? (
            <>
              <div className="rounded-unit border border-red-500/30 bg-red-500/10 p-3.5 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-[var(--unit-text)] dark:text-zinc-100 mb-0.5">Acción de bloqueo</p>
                  <p className="text-[var(--unit-text-muted)] dark:text-zinc-400">
                    Al bloquear este cliente, se restringirá su agendamiento de nuevas citas y compras en el sistema.
                  </p>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--unit-text)] dark:text-zinc-300">
                  Motivo del bloqueo <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Describe la razón del bloqueo..."
                  className="w-full rounded-unit border border-[var(--unit-border)]/60 dark:border-zinc-700 px-4 py-2.5 text-sm text-[var(--unit-text)] dark:text-zinc-100 bg-slate-50/80 hover:bg-[var(--unit-surface-elevated)] focus:bg-[var(--unit-surface-elevated)] dark:bg-zinc-800/70 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500 resize-none"
                  rows={3}
                />
              </div>
            </>
          ) : (
            <div className="rounded-unit border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-[var(--unit-text)] dark:text-zinc-100 mb-0.5">Acción de desbloqueo</p>
                <p className="text-[var(--unit-text-muted)] dark:text-zinc-400">
                  Al desbloquear este cliente, podrá volver a registrar citas y compras con total normalidad.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-3">
            <button 
              type="button" 
              onClick={() => { setBlockModal(false); setBlockReason(''); setSelectedClient(null); }} 
              className="flex-1 px-4 py-2.5 rounded-unit border border-[var(--unit-border)]/60/80 dark:border-zinc-700/80 text-[var(--unit-text)] dark:text-zinc-200 font-semibold bg-slate-100/90 hover:bg-slate-200/90 dark:bg-zinc-800/90 dark:hover:bg-zinc-700/90 transition-all active:scale-[0.98] text-sm"
            >
              Cancelar
            </button>
            <button 
              type="button" 
              onClick={handleBlockSubmit}
              disabled={(!selectedClient?.isBlocked && !blockReason.trim()) || (blockMutation.isPending || unblockMutation.isPending)}
              className={`flex-1 px-4 py-2.5 rounded-unit text-white font-semibold shadow-unit border transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2 ${
                selectedClient?.isBlocked
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-500/30 shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 border-red-500/30 shadow-red-500/20'
              }`}
            >
              {(blockMutation.isPending || unblockMutation.isPending) ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : selectedClient?.isBlocked ? (
                <>
                  <Unlock className="h-4 w-4" />
                  Desbloquear
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Bloquear
                </>
              )}
            </button>
          </div>
        </div>
      </StackedModal>
    </>
  );
}
