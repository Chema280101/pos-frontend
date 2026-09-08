import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataTable } from '@/components/ui';
import { Eye, Download, X, Receipt, Printer, User, ShoppingBag, Ban } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { getStatusColor, getUnitColor } from '@/lib/table-colors';

interface Sale {
  id: string;
  saleNumber: string;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  closedAt: string;
  unit: 'SPA' | 'BARBERIA';
  customer: { name: string };
  employee: { name: string };
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
}

interface SalesReportProps {
  unit: string;
  dateFrom: Date;
  dateTo: Date;
  compact?: boolean;
}

export function SalesReport({ unit, dateFrom, dateTo, compact = false }: SalesReportProps): JSX.Element {
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const user = useAuthStore((s) => s.user);

  const cancelSaleMutation = useMutation({
    mutationFn: async ({ saleId, cancelReason }: { saleId: string; cancelReason: string }) => {
      const { data } = await api.post(`/api/pos/${saleId}/cancel`, { cancelReason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-sales'] });
      success('Venta anulada exitosamente');
      setSelectedSale(null);
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || error.message || 'Error al anular venta';
      showError(msg);
    },
  });

  const handleCancelSale = (sale: Sale) => {
    if (sale.status !== 'CLOSED') {
      showError('Solo se pueden anular ventas cerradas');
      return;
    }
    
    const reason = window.prompt('Ingrese el motivo de anulación (obligatorio):');
    if (reason === null) return;
    if (reason.trim() === '') {
      showError('El motivo es obligatorio para anular la venta');
      return;
    }
    
    if (window.confirm(`¿Está seguro de anular la venta ${sale.saleNumber}? Esta acción retornará el stock y no se puede deshacer.`)) {
      cancelSaleMutation.mutate({ saleId: sale.id, cancelReason: reason });
    }
  };

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['report-sales', unit, dateFrom, dateTo],
    queryFn: async (): Promise<Sale[]> => {
      const params = new URLSearchParams({
        unit: unit || '',
        from: dateFrom.toISOString(),
        to: dateTo.toISOString(),
      });
      const { data } = await api.get<Sale[]>(`/api/reports/sales?${params}`);
      return data;
    },
  });

  const translateBackendTerm = (term: string): string => {
    const paymentMethods: Record<string, string> = {
      'CASH': 'Efectivo',
      'CARD': 'Tarjeta',
      'CREDIT_CARD': 'Tarjeta de Crédito',
      'DEBIT_CARD': 'Tarjeta de Débito',
      'TRANSFER': 'Transferencia',
      'TRANSFERENCIA': 'Transferencia',
      'YAPE': 'Yape',
      'PLIN': 'Plin',
      'BANK_TRANSFER': 'Transferencia Bancaria',
    };

    const statuses: Record<string, string> = {
      'CLOSED': 'Cerrada',
      'OPEN': 'Abierta',
      'CANCELLED': 'Cancelada',
    };

    return paymentMethods[term] || statuses[term] || term;
  };

  const columns = [
    {
      key: 'saleNumber',
      header: 'N° Venta',
      sortable: true,
      render: (row: Sale) => (
        <button
          type="button"
          onClick={() => setSelectedSale(row)}
          className="font-bold text-[var(--unit-accent)] hover:underline"
        >
          {row.saleNumber}
        </button>
      ),
    },
    {
      key: 'createdAt',
      header: 'Fecha',
      sortable: true,
      render: (row: Sale) => format(new Date(row.createdAt), 'd MMM yyyy HH:mm', { locale: es }),
    },
    {
      key: 'customer',
      header: 'Cliente',
      render: (row: Sale) => row.customer?.name || 'Cliente general',
    },
    {
      key: 'employee',
      header: 'Empleado',
      render: (row: Sale) => row.employee?.name || '—',
    },
    {
      key: 'unit',
      header: 'Unidad',
      render: (row: Sale) => (
        <span className={getUnitColor(row.unit)}>
          {row.unit === 'BARBERIA' ? 'Barbería' : 'SPA'}
        </span>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Método',
      render: (row: Sale) => translateBackendTerm(row.paymentMethod),
    },
    {
      key: 'total',
      header: 'Total',
      sortable: true,
      render: (row: Sale) => (
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          S/ {Number(row.total).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row: Sale) => (
        <span className={getStatusColor(row.status)}>
          {translateBackendTerm(row.status)}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: 'Ver detalle',
      variant: 'view' as const,
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: Sale) => {
        setSelectedSale(row);
      },
    },
    ...(user?.role === 'ADMIN' ? [{
      label: 'Anular',
      variant: 'delete' as const,
      icon: <Ban className="h-4 w-4" />,
      onClick: (row: Sale) => handleCancelSale(row),
    }] : [])
  ];

  const filters = [
    {
      key: 'unit',
      label: 'Unidad',
      type: 'select' as const,
      options: [
        { label: 'Todos', value: '' },
        { label: 'SPA', value: 'SPA' },
        { label: 'Barbería', value: 'BARBERIA' },
      ],
    },
  ];

  const displayData = compact ? sales.slice(0, 5) : sales;

  return (
    <div>
      <DataTable
        columns={columns}
        data={displayData}
        keyExtractor={(row) => row.id}
        loading={isLoading}
        searchPlaceholder="Buscar por cliente, empleado, método de pago..."
        filters={filters}
        actions={!compact ? actions : []}
        emptyMessage="No hay ventas en el período seleccionado. Intenta ajustar las fechas o selecciona un rango más amplio."
        pageSize={compact ? 5 : 20}
        maxHeight={compact ? '300px' : '500px'}
        pageSizeOptions={compact ? [5] : [10, 20, 50, 100]}
      />
      {compact && sales.length > 5 && (
        <div className="mt-4 text-center">
          <a href="/reports/sales" className="text-[var(--unit-accent)] hover:underline">
            Ver todas las ventas ({sales.length} total)
          </a>
        </div>
      )}

      {/* Sale Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative overflow-hidden rounded-unit-lg border border-[var(--unit-border)]/60 bg-[var(--unit-surface)] shadow-unit-lg p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[var(--unit-border)]/30">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-unit bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--unit-text)]">Detalle de Venta</h3>
                  <p className="text-xs text-[var(--unit-text-muted)] font-mono">{selectedSale.saleNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="flex h-8 w-8 items-center justify-center rounded-unit border border-[var(--unit-border)]/40 hover:bg-[var(--unit-surface-elevated)] transition-all"
              >
                <X className="h-4 w-4 text-[var(--unit-text-muted)]" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-unit bg-[var(--unit-surface-elevated)] border border-[var(--unit-border)]/30">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--unit-text-muted)]">Total</span>
                  <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    S/ {Number(selectedSale.total).toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--unit-text-muted)]">Estado / Método</span>
                  <p className="text-sm font-semibold text-[var(--unit-text)] mt-1">
                    {translateBackendTerm(selectedSale.status)} • {translateBackendTerm(selectedSale.paymentMethod)}
                  </p>
                </div>
              </div>

              <div className="space-y-2 py-2 border-b border-[var(--unit-border)]/20">
                <div className="flex justify-between">
                  <span className="text-[var(--unit-text-muted)]">Fecha:</span>
                  <span className="font-medium text-[var(--unit-text)]">
                    {format(new Date(selectedSale.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--unit-text-muted)]">Cliente:</span>
                  <span className="font-medium text-[var(--unit-text)]">{selectedSale.customer?.name || 'Cliente general'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--unit-text-muted)]">Empleado / Atendido por:</span>
                  <span className="font-medium text-[var(--unit-text)]">{selectedSale.employee?.name || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--unit-text-muted)]">Unidad de Negocio:</span>
                  <span className="font-medium text-[var(--unit-text)]">{selectedSale.unit === 'BARBERIA' ? 'Barbería' : 'SPA'}</span>
                </div>
              </div>

              {/* Items List if available */}
              {selectedSale.items && selectedSale.items.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--unit-text-muted)] mb-2 flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Ítems / Servicios
                  </h4>
                  <div className="divide-y divide-[var(--unit-border)]/20 rounded-unit border border-[var(--unit-border)]/30 overflow-hidden bg-[var(--unit-surface-elevated)]/50">
                    {selectedSale.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between p-3 text-xs">
                        <div>
                          <p className="font-semibold text-[var(--unit-text)]">{item.name}</p>
                          <p className="text-[var(--unit-text-muted)]">{item.quantity} x S/ {Number(item.unitPrice).toFixed(2)}</p>
                        </div>
                        <span className="font-bold text-[var(--unit-text)]">
                          S/ {(item.quantity * item.unitPrice).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-[var(--unit-border)]/30 flex justify-end gap-2">
              {user?.role === 'ADMIN' && selectedSale.status === 'CLOSED' && (
                <button
                  type="button"
                  onClick={() => handleCancelSale(selectedSale)}
                  disabled={cancelSaleMutation.isPending}
                  className="px-5 py-2 rounded-unit bg-red-500/10 border border-red-500/30 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all mr-auto flex items-center gap-2"
                >
                  <Ban className="h-4 w-4" />
                  {cancelSaleMutation.isPending ? 'Anulando...' : 'Anular Venta'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="px-5 py-2 rounded-unit bg-[var(--unit-surface-elevated)] border border-[var(--unit-border)]/50 text-sm font-semibold text-[var(--unit-text)] hover:border-[var(--unit-accent)]/50 transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
