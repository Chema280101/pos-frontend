'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, TrendingDown, Plus, X } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Select } from '@/components/ui';
import { type ExpenseFormData, type CashEntryFormData } from '@/types/cash';

interface CashRegisterOperationsProps {
  registerId: string;
  unit: string;
}

export function CashRegisterOperations({ registerId, unit }: CashRegisterOperationsProps) {
  const queryClient = useQueryClient();
  const [showExpense, setShowExpense] = useState(false);
  const [showCashEntry, setShowCashEntry] = useState(false);
  
  // Form states
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseReason, setExpenseReason] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [cashReason, setCashReason] = useState('');
  const [cashType, setCashType] = useState('');

  // Add expense mutation
  const addExpenseMutation = useMutation({
    mutationFn: async (data: { amount: number; reason: string }) => {
      await api.post(`/api/cash-register/${registerId}/expense`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-open'] });
      setExpenseAmount('');
      setExpenseReason('');
      setShowExpense(false);
    },
  });

  // Add cash entry mutation
  const addCashEntryMutation = useMutation({
    mutationFn: async (data: { amount: number; reason: string; type: string }) => {
      await api.post(`/api/cash-register/${registerId}/cash-entry`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-open'] });
      setCashAmount('');
      setCashReason('');
      setCashType('');
      setShowCashEntry(false);
    },
  });

  const handleAddExpense = () => {
    const amount = parseFloat(expenseAmount);
    if (amount > 0 && expenseReason.trim()) {
      addExpenseMutation.mutate({ amount, reason: expenseReason.trim() });
    }
  };

  const handleAddCashEntry = () => {
    const amount = parseFloat(cashAmount);
    if (amount > 0 && cashReason.trim() && cashType) {
      addCashEntryMutation.mutate({ amount, reason: cashReason.trim(), type: cashType });
    }
  };

  return (
    <div className="space-y-6">
      {/* Expense Form */}
      <div className="bg-[var(--unit-surface-elevated)] rounded-unit border border-[var(--unit-border)]/60 shadow-unit-sm">
        <div className="p-4 border-b border-[var(--unit-border)]/60">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--unit-text)] flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Registrar Egreso
            </h3>
            <button
              onClick={() => setShowExpense(!showExpense)}
              className="text-[var(--unit-text-muted)] hover:text-[var(--unit-text)]"
            >
              {showExpense ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {showExpense && (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--unit-text)] mb-1">
                Monto
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--unit-border)] rounded-unit focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--unit-text)] mb-1">
                Motivo
              </label>
              <textarea
                value={expenseReason}
                onChange={(e) => setExpenseReason(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--unit-border)] rounded-unit focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Compra de insumos, mantenimiento, pago de servicios, etc."
                rows={3}
              />
            </div>
            
            <button
              onClick={handleAddExpense}
              disabled={addExpenseMutation.isPending}
              className="w-full bg-red-500 text-white py-2 px-4 rounded-unit hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {addExpenseMutation.isPending ? 'Registrando...' : 'Registrar Egreso'}
            </button>
          </div>
        )}
      </div>

      {/* Cash Entry Form */}
      <div className="bg-[var(--unit-surface-elevated)] rounded-unit border border-[var(--unit-border)]/60 shadow-unit-sm">
        <div className="p-4 border-b border-[var(--unit-border)]/60">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--unit-text)] flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Registrar Ingreso
            </h3>
            <button
              onClick={() => setShowCashEntry(!showCashEntry)}
              className="text-[var(--unit-text-muted)] hover:text-[var(--unit-text)]"
            >
              {showCashEntry ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {showCashEntry && (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--unit-text)] mb-1">
                Monto
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--unit-border)] rounded-unit focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Select
                label="Tipo"
                options={[
                  { value: '', label: 'Seleccionar tipo...', disabled: true },
                  { value: 'CASH_ENTRY', label: 'Ingreso de efectivo' },
                  { value: 'TRANSFER_ENTRY', label: 'Transferencia' },
                  { value: 'OTHER_ENTRY', label: 'Otro' }
                ]}
                value={cashType}
                onChange={(e) => setCashType(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--unit-text)] mb-1">
                Motivo
              </label>
              <textarea
                value={cashReason}
                onChange={(e) => setCashReason(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--unit-border)] rounded-unit focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Venta del día, pago de cliente, ingreso extra, etc."
                rows={3}
              />
            </div>
            
            <button
              onClick={handleAddCashEntry}
              disabled={addCashEntryMutation.isPending}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-unit hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {addCashEntryMutation.isPending ? 'Registrando...' : 'Registrar Ingreso'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
