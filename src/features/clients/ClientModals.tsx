'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Plus, Lock, Unlock, AlertCircle, CreditCard, X, Loader2, CheckCircle } from 'lucide-react';
import type { Client } from '../../types/client';

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
}: ClientModalsProps) {
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [blockReason, setBlockReason] = useState('');
  
  const queryClient = useQueryClient();

  // Credit mutation (reused from ClientDetail)
  const creditMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClient) throw new Error('No client selected');
      await api.post(`/api/clients/${selectedClient.id}/credit`, {
        amount: Number(creditAmount),
        reason: creditReason.trim(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      if (selectedClient) {
        queryClient.invalidateQueries({ queryKey: ['client', selectedClient.id] });
        queryClient.invalidateQueries({ queryKey: ['client-history', selectedClient.id] });
      }
      setCreditModal(false);
      setCreditAmount('');
      setCreditReason('');
      setSelectedClient(null);
    },
    onError: (error: any) => {
      console.error('Error adding credit:', error);
    }
  });

  // Block mutation (reused from ClientDetail)
  const blockMutation = useMutation({
    mutationFn: async (reason: string) => {
      if (!selectedClient) throw new Error('No client selected');
      await api.post(`/api/clients/${selectedClient.id}/block`, { blockReason: reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      if (selectedClient) {
        queryClient.invalidateQueries({ queryKey: ['client', selectedClient.id] });
        queryClient.invalidateQueries({ queryKey: ['client-history', selectedClient.id] });
      }
      setBlockModal(false);
      setBlockReason('');
      setSelectedClient(null);
    },
    onError: (error: any) => {
      console.error('Error blocking client:', error);
    }
  });

  // Unblock mutation (reused from ClientDetail)
  const unblockMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClient) throw new Error('No client selected');
      await api.post(`/api/clients/${selectedClient.id}/unblock`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      if (selectedClient) {
        queryClient.invalidateQueries({ queryKey: ['client', selectedClient.id] });
        queryClient.invalidateQueries({ queryKey: ['client-history', selectedClient.id] });
      }
      setBlockModal(false);
      setBlockReason('');
      setSelectedClient(null);
    },
    onError: (error: any) => {
      console.error('Error unblocking client:', error);
    }
  });

  const handleCreditSubmit = () => {
    if (!creditAmount || Number(creditAmount) <= 0) return;
    creditMutation.mutate();
  };

  const handleBlockSubmit = () => {
    if (!selectedClient) return;
    
    if (selectedClient.isBlocked) {
      unblockMutation.mutate();
    } else {
      if (!blockReason.trim()) {
        return;
      }
      blockMutation.mutate(blockReason);
    }
  };

  return (
    <>
      {/* Enhanced Credit Modal */}
      {creditModal && selectedClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl max-w-md w-full transform transition-all">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--unit-text)]">Agregar Crédito</h3>
                    <p className="text-sm text-[var(--unit-text-muted)]">{selectedClient.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setCreditModal(false); setCreditAmount(''); setCreditReason(''); setSelectedClient(null); }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--unit-border)]/30 bg-[var(--unit-surface)] hover:bg-[var(--unit-surface-elevated)] transition-colors"
                >
                  <X className="h-4 w-4 text-[var(--unit-text-muted)]" />
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 space-y-6">
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
                    min="0"
                    step="0.10"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Motivo</label>
                <textarea
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  placeholder="Ej: Pago adelantado, bonificación, etc."
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Block Modal */}
      {blockModal && selectedClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl max-w-md w-full transform transition-all">
            {/* Modal Header */}
            <div className={`relative px-6 py-4 border-b border-[var(--unit-border)]/30 ${
              selectedClient.isBlocked 
                ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-600/5' 
                : 'bg-gradient-to-r from-red-500/10 to-red-600/5'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-lg ${
                    selectedClient.isBlocked 
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' 
                      : 'bg-gradient-to-br from-red-500 to-red-600'
                  }`}>
                    {selectedClient.isBlocked ? (
                      <Unlock className="h-6 w-6 text-white" />
                    ) : (
                      <Lock className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--unit-text)]">
                      {selectedClient.isBlocked ? 'Desbloquear Cliente' : 'Bloquear Cliente'}
                    </h3>
                    <p className="text-sm text-[var(--unit-text-muted)]">{selectedClient.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setBlockModal(false); setBlockReason(''); setSelectedClient(null); }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--unit-border)]/30 bg-[var(--unit-surface)] hover:bg-[var(--unit-surface-elevated)] transition-colors"
                >
                  <X className="h-4 w-4 text-[var(--unit-text-muted)]" />
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {!selectedClient.isBlocked ? (
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
                      placeholder="Describe el motivo por el cual se está bloqueando este cliente..."
                      className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all resize-none"
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
                  onClick={handleBlockSubmit}
                  disabled={(!selectedClient.isBlocked && !blockReason.trim()) || (blockMutation.isPending || unblockMutation.isPending)}
                  className={`flex-1 px-6 py-3 rounded-xl text-white font-bold shadow-lg border-2 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 ${
                    selectedClient.isBlocked
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
                      {selectedClient.isBlocked ? (
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
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
