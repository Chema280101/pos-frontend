'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, TrendingDown, Plus, X } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Registrar Egreso
            </h3>
            <button
              onClick={() => setShowExpense(!showExpense)}
              className="text-gray-500 hover:text-gray-700"
            >
              {showExpense ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {showExpense && (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo
              </label>
              <textarea
                value={expenseReason}
                onChange={(e) => setExpenseReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descripción del egreso..."
                rows={3}
              />
            </div>
            
            <button
              onClick={handleAddExpense}
              disabled={addExpenseMutation.isPending}
              className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {addExpenseMutation.isPending ? 'Registrando...' : 'Registrar Egreso'}
            </button>
          </div>
        )}
      </div>

      {/* Cash Entry Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Registrar Ingreso
            </h3>
            <button
              onClick={() => setShowCashEntry(!showCashEntry)}
              className="text-gray-500 hover:text-gray-700"
            >
              {showCashEntry ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {showCashEntry && (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={cashType}
                onChange={(e) => setCashType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar tipo...</option>
                <option value="CASH_ENTRY">Ingreso de efectivo</option>
                <option value="TRANSFER_ENTRY">Transferencia</option>
                <option value="OTHER_ENTRY">Otro</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo
              </label>
              <textarea
                value={cashReason}
                onChange={(e) => setCashReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descripción del ingreso..."
                rows={3}
              />
            </div>
            
            <button
              onClick={handleAddCashEntry}
              disabled={addCashEntryMutation.isPending}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {addCashEntryMutation.isPending ? 'Registrando...' : 'Registrar Ingreso'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
