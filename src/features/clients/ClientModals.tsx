'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Plus, Lock, Unlock, AlertCircle, CreditCard, X, Loader2, CheckCircle, UserCheck, UserX } from 'lucide-react';
import type { Client } from '../../types/client';
import { StackedModal } from '@/components/ui';

interface ClientModalsProps {
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

  // ESC key handler for modals
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Credit Modal
        if (creditModal) {
          setCreditModal(false);
          setCreditAmount('');
          setCreditReason('');
          setSelectedClient(null);
        }
        // Block Modal
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
  }, [creditModal, creditAmount, creditReason, selectedClient, blockModal, blockReason]);

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
        description={selectedClient?.name}
        modalId="credit-modal"
        modalName="Agregar Crédito"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Monto *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-[var(--unit-text-muted)] font-medium">S/</span>
              </div>
              <input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 pl-8 pr-3 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Motivo *</label>
            <textarea
              value={creditReason}
              onChange={(e) => setCreditReason(e.target.value)}
              placeholder="Describe el motivo del crédito..."
              className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all resize-none"
              rows={3}
            />
          </div>
        </div>
        
        {/* Enhanced Action Buttons */}
        <div className="px-6 py-4 bg-gradient-to-r from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] border-t border-[var(--unit-border)]/30">
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={() => { setCreditModal(false); setCreditAmount(''); setCreditReason(''); setSelectedClient(null); }} 
              className="px-6 py-3 rounded-xl border-2 border-[var(--unit-accent)]/50 text-[var(--unit-accent)] font-bold bg-[var(--unit-surface)] hover:bg-[var(--unit-accent)] hover:text-white transition-all hover:shadow-lg active:scale-[0.98]"
            >
              <span className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Cancelar
              </span>
            </button>
            <button 
              type="button" 
              onClick={handleCreditSubmit}
              disabled={!creditAmount || Number(creditAmount) <= 0 || creditMutation.isPending}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white font-bold shadow-lg border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              {creditMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Agregando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Plus className="h-4 w-4" />
                  Agregar Crédito
                </span>
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
        description={selectedClient?.name}
        modalId="block-modal"
        modalName="Bloquear Cliente"
      >
        <div className="space-y-6">
          {!selectedClient?.isBlocked ? (
            <>
              <div className={`rounded-xl border-2 border-red-500/30 bg-gradient-to-br from-red-50 to-red-100 p-4`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-800 mb-1">Acción de bloqueo</p>
                    <p className="text-sm text-red-700">
                      Al bloquear este cliente, no podrá realizar nuevas citas o compras en el sistema.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Motivo del bloqueo *</label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Describe el motivo del bloqueo..."
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all resize-none"
                  rows={3}
                />
              </div>
            </>
          ) : (
            <div className={`rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-emerald-100 p-4`}>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-emerald-800 mb-1">Acción de desbloqueo</p>
                  <p className="text-sm text-emerald-700">
                    Al desbloquear este cliente, podrá volver a realizar citas y compras normalmente en el sistema.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Enhanced Action Buttons */}
        <div className="px-6 py-4 bg-gradient-to-r from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] border-t border-[var(--unit-border)]/30">
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={() => { setBlockModal(false); setBlockReason(''); setSelectedClient(null); }} 
              className="px-6 py-3 rounded-xl border-2 border-[var(--unit-accent)]/50 text-[var(--unit-accent)] font-bold bg-[var(--unit-surface)] hover:bg-[var(--unit-accent)] hover:text-white transition-all hover:shadow-lg active:scale-[0.98]"
            >
              <span className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Cancelar
              </span>
            </button>
            <button 
              type="button" 
              onClick={handleBlockSubmit}
              disabled={(!selectedClient?.isBlocked && !blockReason.trim()) || (blockMutation.isPending || unblockMutation.isPending)}
              className={`flex-1 px-6 py-3 rounded-xl text-white font-bold shadow-lg border-2 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 ${
                selectedClient?.isBlocked
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 border-emerald-600/50 hover:from-emerald-600 hover:to-emerald-700'
                  : 'bg-gradient-to-r from-red-500 to-red-600 border-red-600/50 hover:from-red-600 hover:to-red-700'
              }`}
            >
              {(blockMutation.isPending || unblockMutation.isPending) ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {selectedClient?.isBlocked ? (
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
                </span>
              )}
            </button>
          </div>
        </div>
      </StackedModal>
    </>
  );
}
