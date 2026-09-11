'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, TrendingDown, DollarSign, Clock, Building2, User } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui';
import { useToast } from '@/hooks/useToast';

interface CashApprovalsPanelProps {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';
  typeFilter?: 'ALL' | 'EXPENSE' | 'INCOME';
}

export function CashApprovalsPanel({ status = 'PENDING', typeFilter = 'ALL' }: CashApprovalsPanelProps) {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['cash-approvals', status],
    queryFn: async () => {
      const { data } = await api.get(`/api/cash-register/approvals/list?status=${status}`);
      return data;
    },
    refetchInterval: 15 * 1000,
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: 'APPROVED' | 'REJECTED' }) => {
      const { data } = await api.patch(`/api/cash-register/expenses/${id}/approval`, { status: newStatus });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cash-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['cash-summary'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-open'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      success(variables.newStatus === 'APPROVED' ? 'Gasto aprobado correctamente' : 'Gasto rechazado');
      setProcessingId(null);
    },
    onError: (err: any) => {
      showError(err?.response?.data?.error || 'Error al procesar el gasto');
      setProcessingId(null);
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: 'APPROVED' | 'REJECTED' }) => {
      const { data } = await api.patch(`/api/cash-register/entries/${id}/approval`, { status: newStatus });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cash-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['cash-summary'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-open'] });
      queryClient.invalidateQueries({ queryKey: ['income'] });
      success(variables.newStatus === 'APPROVED' ? 'Ingreso adicional aprobado correctamente' : 'Ingreso rechazado');
      setProcessingId(null);
    },
    onError: (err: any) => {
      showError(err?.response?.data?.error || 'Error al procesar el ingreso');
      setProcessingId(null);
    },
  });

  const expenses = Array.isArray(data?.expenses) ? data.expenses : [];
  const entries = Array.isArray(data?.entries) ? data.entries : [];

  const items = [
    ...(typeFilter === 'ALL' || typeFilter === 'EXPENSE'
      ? expenses.map((e: any) => ({ ...e, itemType: 'EXPENSE' as const }))
      : []),
    ...(typeFilter === 'ALL' || typeFilter === 'INCOME'
      ? entries.map((e: any) => ({ ...e, itemType: 'INCOME' as const }))
      : []),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleAction = (item: any, newStatus: 'APPROVED' | 'REJECTED') => {
    setProcessingId(item.id);
    if (item.itemType === 'EXPENSE') {
      updateExpenseMutation.mutate({ id: item.id, newStatus });
    } else {
      updateEntryMutation.mutate({ id: item.id, newStatus });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center text-sm text-gray-500">
        Cargando solicitudes de caja...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-sm text-red-500">
        Error al cargar solicitudes de caja
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center flex flex-col items-center gap-2">
        <CheckCircle className="h-8 w-8 text-gray-400" />
        <p className="text-sm text-gray-500">No hay solicitudes de caja {status === 'PENDING' ? 'pendientes' : ''}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                item.itemType === 'EXPENSE'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              }`}
            >
              {item.itemType === 'EXPENSE' ? (
                <TrendingDown className="h-5 w-5" />
              ) : (
                <DollarSign className="h-5 w-5" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.itemType === 'EXPENSE'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {item.itemType === 'EXPENSE' ? 'GASTO DE CAJA' : 'INGRESO ADICIONAL'}
                </span>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-800'
                      : item.status === 'APPROVED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {item.status === 'PENDING'
                    ? 'Pendiente'
                    : item.status === 'APPROVED'
                    ? 'Aprobada'
                    : 'Rechazada'}
                </span>

                <span className="text-xs text-gray-500 flex items-center gap-1 font-mono">
                  <Building2 className="h-3 w-3" />
                  {item.cashRegister?.unit || 'Sede'}
                </span>
              </div>

              <div className="text-sm font-semibold text-gray-900">
                {item.reason}
              </div>

              <div className="text-xs text-gray-500 flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3 text-gray-400" />
                  Solicitado por: <strong>{item.createdBy?.name || 'Cajero'}</strong>
                </span>
                <span>•</span>
                <span>Categoría: {item.category || item.type || 'General'}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  {new Date(item.createdAt).toLocaleString('es-PE')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0">
            <div className="text-right">
              <span className="text-xs text-gray-400 block font-medium">Monto</span>
              <span
                className={`text-lg font-bold font-mono ${
                  item.itemType === 'EXPENSE' ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {item.itemType === 'EXPENSE' ? '-' : '+'} S/ {Number(item.amount).toFixed(2)}
              </span>
            </div>

            {item.status === 'PENDING' && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleAction(item, 'APPROVED')}
                  disabled={processingId === item.id}
                  isLoading={processingId === item.id}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[85px]"
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  Aprobar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAction(item, 'REJECTED')}
                  disabled={processingId === item.id}
                  isLoading={processingId === item.id}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 min-w-[85px]"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Rechazar
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
