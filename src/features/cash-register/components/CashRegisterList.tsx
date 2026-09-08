import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, FileDown, Calendar, ChevronDown, ChevronUp, Lock, Unlock } from 'lucide-react';
import { api } from '@/lib/api';
import { DataTable, type Column, type Action } from '@/components/ui/DataTable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { CashRegister, BusinessUnit } from '@/types/cash';

interface CashRegisterListProps {
  unit: BusinessUnit;
  unitFilter: string;
  statusFilter: string;
  dateFrom: Date;
  dateTo: Date;
  onViewDetails: (register: CashRegister) => void;
  onExportPDF: (register: CashRegister) => void;
}

export function CashRegisterList({
  unit,
  unitFilter,
  statusFilter,
  dateFrom,
  dateTo,
  onViewDetails,
  onExportPDF
}: CashRegisterListProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Obtener lista de cajas
  const { data: registersData = { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } } } = useQuery({
    queryKey: ['cash-registers', unit, unitFilter, statusFilter, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('unit', unit);
      if (unitFilter) params.set('unitFilter', unitFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (dateFrom) params.set('dateFrom', dateFrom.toISOString());
      if (dateTo) params.set('dateTo', dateTo.toISOString());
      params.set('limit', '20');

      const { data } = await api.get(`/api/cash-register?${params}`);
      return data;
    },
    staleTime: 60 * 1000, // 1 minuto
  });

  const columns: Column<CashRegister>[] = [
    {
      key: 'id',
      header: 'N° Caja',
      render: (row: CashRegister) => (
        <span className="font-medium text-[var(--unit-text)]">
          #{row.id.slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      key: 'unit',
      header: 'Unidad',
      render: (row: CashRegister) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.unit === 'SPA' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-amber-100 text-amber-800'
        }`}>
          {row.unit === 'SPA' ? 'SPA' : 'Barbería'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row: CashRegister) => (
        <div className="flex items-center gap-2">
          {row.status === 'OPEN' ? (
            <>
              <Unlock className="h-4 w-4 text-green-600" />
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Abierta
              </span>
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 text-[var(--unit-text-muted)]" />
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-[var(--unit-text)]">
                Cerrada
              </span>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'openedAt',
      header: 'Apertura',
      render: (row: CashRegister) => (
        <div>
          <div className="text-sm text-[var(--unit-text)]">
            {format(new Date(row.openedAt), 'dd/MM/yyyy', { locale: es })}
          </div>
          <div className="text-xs text-[var(--unit-text-muted)]">
            {format(new Date(row.openedAt), 'HH:mm', { locale: es })}
          </div>
        </div>
      ),
    },
    {
      key: 'openingAmount',
      header: 'Monto Apertura',
      render: (row: CashRegister) => (
        <span className="font-medium text-[var(--unit-text)]">
          S/ {row.openingAmount?.toFixed(2) || '0.00'}
        </span>
      ),
    },
    {
      key: 'closedAt',
      header: 'Cierre',
      render: (row: CashRegister) => (
        row.closedAt ? (
          <div>
            <div className="text-sm text-[var(--unit-text)]">
              {format(new Date(row.closedAt), 'dd/MM/yyyy', { locale: es })}
            </div>
            <div className="text-xs text-[var(--unit-text-muted)]">
              {format(new Date(row.closedAt), 'HH:mm', { locale: es })}
            </div>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    {
      key: 'difference',
      header: 'Diferencia',
      render: (row: CashRegister) => {
        if (!row.difference) return <span className="text-gray-400">-</span>;
        
        const isPositive = row.difference >= 0;
        return (
          <span className={`font-medium ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? '+' : ''}S/ {row.difference.toFixed(2)}
          </span>
        );
      },
    },
  ];

  const actions: Action<CashRegister>[] = [
    {
      label: 'Ver detalles',
      variant: 'view',
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: CashRegister) => onViewDetails(row),
    },
    {
      label: 'Exportar PDF',
      variant: 'download',
      icon: <FileDown className="h-4 w-4" />,
      onClick: (row: CashRegister) => onExportPDF(row),
      disabled: (row: CashRegister) => row.status !== 'CLOSED',
    },
  ];

  const toggleExpanded = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[var(--unit-text)]">Historial de Cajas</h2>
        <div className="text-sm text-[var(--unit-text-muted)]">
          Mostrando {registersData.data.length} de {registersData.pagination.total} registros
        </div>
      </div>

      <DataTable
        data={registersData.data}
        columns={columns}
        actions={actions}
        keyExtractor={(row: CashRegister) => row.id}
        pageSize={20}
        loading={false}
        emptyMessage="No hay cajas registradas"
      />
    </div>
  );
}
