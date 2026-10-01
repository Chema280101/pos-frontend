'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CheckCircle, 
  XCircle, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Building2, 
  User, 
  Trash2, 
  Edit3,
  ShieldAlert,
  Receipt,
  ShoppingBag,
  Scissors
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui';
import { useToast } from '@/hooks/useToast';

interface CashApprovalsPanelProps {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';
  typeFilter?: 'ALL' | 'EXPENSE' | 'INCOME' | 'SALE' | 'INVENTORY' | 'SERVICE';
}

export function CashApprovalsPanel({ status = 'PENDING', typeFilter = 'ALL' }: CashApprovalsPanelProps) {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 1. Cargar aprobaciones de caja (creación de gastos e ingresos)
  const { data, isLoading: loadingCash, error } = useQuery({
    queryKey: ['cash-approvals', status],
    queryFn: async () => {
      const { data } = await api.get(`/api/cash-register/approvals/list?status=${status}`);
      return data;
    },
    refetchInterval: 15 * 1000,
  });

  // 2. Cargar solicitudes de operaciones (eliminación o edición por no-admins)
  const { data: opData, isLoading: loadingOps } = useQuery({
    queryKey: ['operation-approvals', status],
    queryFn: async () => {
      const { data } = await api.get(`/api/approvals/operations/list?status=${status}`);
      return data;
    },
    refetchInterval: 15 * 1000,
  });

  const isLoading = loadingCash || loadingOps;

  // Mutación para aprobar/rechazar creación de gastos
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

  // Mutación para aprobar/rechazar creación de ingresos adicionales
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

  // Mutación para resolver solicitudes de operaciones (eliminación/modificación de trabajadores)
  const updateOperationMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: 'APPROVED' | 'REJECTED' }) => {
      const { data } = await api.patch(`/api/approvals/operations/${id}/resolve`, { status: newStatus });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['operation-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['cash-summary'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-open'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      success(variables.newStatus === 'APPROVED' ? 'Solicitud aprobada y ejecutada exitosamente' : 'Solicitud rechazada');
      setProcessingId(null);
    },
    onError: (err: any) => {
      showError(err?.response?.data?.error || 'Error al procesar la operación');
      setProcessingId(null);
    },
  });

  const expenses = Array.isArray(data?.expenses) ? data.expenses : [];
  const entries = Array.isArray(data?.entries) ? data.entries : [];
  const operations = Array.isArray(opData?.data) ? opData.data : [];

  // Mapear operaciones filtradas
  const mappedOperations = operations
    .filter((op: any) => {
      if (typeFilter === 'EXPENSE') return op.entityType === 'EXPENSE';
      if (typeFilter === 'INCOME') return false;
      if (typeFilter === 'SALE') return op.entityType === 'SALE';
      if (typeFilter === 'INVENTORY') return op.entityType === 'INVENTORY';
      if (typeFilter === 'SERVICE') return op.entityType === 'SERVICE';
      return true;
    })
    .map((op: any) => {
      const isDelete = op.action === 'DELETE';
      const orig = op.payload?.original || {};
      const prop = op.payload?.proposed || {};
      const amount = isDelete 
        ? Number(orig.amount || orig.totalAmount || orig.price || 0) 
        : Number(prop.amount ?? prop.price ?? orig.amount ?? orig.price ?? 0);

      return {
        id: op.id,
        itemType: 'OPERATION' as const,
        action: op.action as 'DELETE' | 'UPDATE',
        entityType: op.entityType,
        reason: op.reason,
        status: op.status,
        createdAt: op.createdAt,
        createdBy: op.requestedBy,
        amount,
        unit: op.unit,
        originalData: orig,
        proposedData: prop,
      };
    });

  const items = [
    ...(typeFilter === 'ALL' || typeFilter === 'EXPENSE'
      ? expenses.map((e: any) => ({ ...e, itemType: 'EXPENSE' as const }))
      : []),
    ...(typeFilter === 'ALL' || typeFilter === 'INCOME'
      ? entries.map((e: any) => ({ ...e, itemType: 'INCOME' as const }))
      : []),
    ...mappedOperations,
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleAction = (item: any, newStatus: 'APPROVED' | 'REJECTED') => {
    setProcessingId(item.id);
    if (item.itemType === 'OPERATION') {
      updateOperationMutation.mutate({ id: item.id, newStatus });
    } else if (item.itemType === 'EXPENSE') {
      updateExpenseMutation.mutate({ id: item.id, newStatus });
    } else {
      updateEntryMutation.mutate({ id: item.id, newStatus });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        Cargando solicitudes...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-sm text-red-500">
        Error al cargar solicitudes
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-10 text-center flex flex-col items-center gap-2">
        <CheckCircle className="h-10 w-10 text-gray-400" />
        <p className="text-sm text-gray-500">No hay solicitudes {status === 'PENDING' ? 'pendientes' : ''}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {items.map((item: any) => {
        const isOperation = item.itemType === 'OPERATION';
        const isDelete = isOperation && item.action === 'DELETE';
        const isUpdate = isOperation && item.action === 'UPDATE';
        const isSale = isOperation && item.entityType === 'SALE';
        const isInventory = isOperation && item.entityType === 'INVENTORY';
        const isService = isOperation && item.entityType === 'SERVICE';

        return (
          <div
            key={item.id}
            className={`border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isDelete 
                ? 'bg-red-50/20 border-red-200/80 dark:bg-red-950/10 dark:border-red-900/30' 
                : isUpdate
                ? 'bg-amber-50/20 border-amber-200/80 dark:bg-amber-950/10 dark:border-amber-900/30'
                : 'bg-white dark:bg-gray-800 border-gray-200/80 dark:border-gray-700'
            }`}
          >
            <div className="flex items-start gap-3.5">
              {/* Icon Container */}
              <div
                className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                  isSale
                    ? 'bg-rose-600 text-white'
                    : isInventory
                    ? 'bg-indigo-600 text-white'
                    : isService
                    ? 'bg-purple-600 text-white'
                    : isDelete
                    ? 'bg-red-600 text-white'
                    : isUpdate
                    ? 'bg-amber-500 text-white'
                    : item.itemType === 'EXPENSE'
                    ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800'
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
                }`}
              >
                {isSale ? (
                  <Receipt className="h-5 w-5" />
                ) : isInventory ? (
                  <ShoppingBag className="h-5 w-5" />
                ) : isService ? (
                  <Scissors className="h-5 w-5" />
                ) : isDelete ? (
                  <Trash2 className="h-5 w-5" />
                ) : isUpdate ? (
                  <Edit3 className="h-5 w-5" />
                ) : item.itemType === 'EXPENSE' ? (
                  <TrendingDown className="h-5 w-5" />
                ) : (
                  <DollarSign className="h-5 w-5" />
                )}
              </div>

              {/* Main Info */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Badge de Tipo */}
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      isSale
                        ? 'bg-rose-600 text-white shadow-xs'
                        : isInventory
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : isService
                        ? 'bg-purple-600 text-white shadow-xs'
                        : isDelete
                        ? 'bg-red-600 text-white shadow-xs'
                        : isUpdate
                        ? 'bg-amber-500 text-white shadow-xs'
                        : item.itemType === 'EXPENSE'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                    }`}
                  >
                    {isSale 
                      ? '🧾 ANULACIÓN DE VENTA'
                      : isInventory 
                      ? isDelete ? '🗑️ ELIMINACIÓN DE PRODUCTO' : '✏️ MODIFICACIÓN DE PRODUCTO'
                      : isService
                      ? isDelete ? '🗑️ ELIMINACIÓN DE SERVICIO' : '✏️ MODIFICACIÓN DE SERVICIO'
                      : isDelete 
                      ? '🗑️ SOLICITUD DE ELIMINACIÓN' 
                      : isUpdate 
                      ? '✏️ SOLICITUD DE EDICIÓN' 
                      : item.itemType === 'EXPENSE' 
                      ? 'GASTO DE CAJA' 
                      : 'INGRESO ADICIONAL'}
                  </span>

                  {/* Badge de Estado */}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                        : item.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                    }`}
                  >
                    {item.status === 'PENDING'
                      ? 'Pendiente'
                      : item.status === 'APPROVED'
                      ? 'Aprobada'
                      : 'Rechazada'}
                  </span>

                  {/* Sede / Unidad */}
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 font-mono">
                    <Building2 className="h-3 w-3" />
                    {item.unit || item.cashRegister?.unit || 'Sede'}
                  </span>
                </div>

                {/* Motivo del trabajador */}
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {isOperation ? (
                    <span className="flex items-center gap-1.5 text-gray-900 dark:text-gray-100">
                      <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Motivo del trabajador: <strong>"{item.reason}"</strong></span>
                    </span>
                  ) : (
                    item.reason
                  )}
                </div>

                {/* Si es operación, mostrar el detalle del registro afectado */}
                {isOperation && item.originalData && (
                  <div className="text-xs bg-gray-100/80 dark:bg-gray-700/50 rounded-lg px-2.5 py-1.5 text-gray-700 dark:text-gray-300 space-y-0.5">
                    {isSale ? (
                      <div>
                        Venta: <strong>Ticket #{item.originalData.saleNumber || item.originalData.id?.slice(0, 8)}</strong>
                        {item.originalData.customerName && ` • Cliente: ${item.originalData.customerName}`}
                        {item.originalData.totalAmount !== undefined && ` • Total: S/ ${Number(item.originalData.totalAmount).toFixed(2)}`}
                      </div>
                    ) : isInventory ? (
                      <div>
                        Producto: <strong>{item.originalData.name}</strong>
                        {item.originalData.sku && ` • SKU: ${item.originalData.sku}`}
                        {item.originalData.stock !== undefined && ` • Stock: ${item.originalData.stock}`}
                      </div>
                    ) : isService ? (
                      <div>
                        Servicio: <strong>{item.originalData.name}</strong>
                        {item.originalData.price !== undefined && ` • Precio: S/ ${Number(item.originalData.price).toFixed(2)}`}
                        {item.originalData.durationMin !== undefined && ` • Duración: ${item.originalData.durationMin} min`}
                      </div>
                    ) : (
                      <div>
                        Registro original: <strong>{item.originalData.reason || 'Sin concepto'}</strong>
                        {item.originalData.category && ` (${item.originalData.category})`}
                      </div>
                    )}

                    {isUpdate && item.proposedData && (
                      <div className="text-amber-700 dark:text-amber-400 font-medium">
                        Cambios propuestos:{' '}
                        {item.proposedData.name && `Nuevo nombre: "${item.proposedData.name}" `}
                        {item.proposedData.price !== undefined && `• Nuevo precio: S/ ${Number(item.proposedData.price).toFixed(2)} `}
                        {item.proposedData.amount !== undefined && `• Nuevo monto: S/ ${Number(item.proposedData.amount).toFixed(2)} `}
                        {item.proposedData.reason && `• Nuevo concepto: "${item.proposedData.reason}"`}
                      </div>
                    )}
                  </div>
                )}

                {/* Metadatos */}
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-gray-400" />
                    Solicitado por: <strong>{item.createdBy?.name || 'Trabajador'}</strong>
                    {item.createdBy?.role && ` (${item.createdBy.role})`}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    {new Date(item.createdAt).toLocaleString('es-PE')}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions & Amount */}
            <div className="flex items-center justify-between sm:justify-end gap-3.5 pt-2 sm:pt-0 border-t sm:border-0 border-gray-100 dark:border-gray-700">
              {item.amount > 0 && (
                <div className="text-right">
                  <span className="text-[11px] text-gray-400 block font-medium uppercase tracking-wider">
                    {isDelete ? 'Monto a anular' : 'Monto'}
                  </span>
                  <span
                    className={`text-lg font-bold font-mono ${
                      isDelete
                        ? 'text-red-600 dark:text-red-400'
                        : item.itemType === 'EXPENSE'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {item.itemType === 'INCOME' ? '+' : '-'} S/ {Number(item.amount).toFixed(2)}
                  </span>
                </div>
              )}

              {item.status === 'PENDING' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAction(item, 'APPROVED')}
                    disabled={processingId === item.id}
                    isLoading={processingId === item.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[90px] shadow-sm font-semibold"
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
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 min-w-[90px] font-semibold"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Rechazar
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
