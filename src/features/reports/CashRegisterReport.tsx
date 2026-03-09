import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataTable } from '@/components/ui/DataTable';
import { Edit, Eye, DollarSign, Calendar, User, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CashRegister {
  id: string;
  openedAt: string;
  closedAt?: string;
  openingAmount: number;
  closingDeclared?: number;
  closingExpected?: number;
  difference?: number;
  status: 'OPEN' | 'CLOSED';
  unit: 'SPA' | 'BARBERIA';
  openedBy: { name: string };
  closedBy?: { name: string };
  totalSales: number;
  totalExpenses: number;
  netAmount: number;
}

interface CashRegisterReportProps {
  unit: string;
  dateFrom: Date;
  dateTo: Date;
  compact?: boolean;
}

export function CashRegisterReport({ unit, dateFrom, dateTo, compact = false }: CashRegisterReportProps): JSX.Element {
  const { data: cashRegisters = [], isLoading } = useQuery({
    queryKey: ['report-cash-registers', unit, dateFrom, dateTo],
    queryFn: async (): Promise<CashRegister[]> => {
      const params = new URLSearchParams({
        unit: unit || '',
        from: dateFrom.toISOString(),
        to: dateTo.toISOString(),
      });
      const { data } = await api.get<CashRegister[]>(`/api/reports/cash-register?${params}`);
      return data;
    },
  });

  const columns = [
    {
      key: 'openedAt',
      header: 'Apertura',
      sortable: true,
      render: (row: CashRegister) => (
        <div>
          <div className="font-medium">{format(new Date(row.openedAt), 'd MMM yyyy', { locale: es })}</div>
          <div className="text-sm text-[var(--unit-text-muted)]">{format(new Date(row.openedAt), 'HH:mm')}</div>
        </div>
      ),
    },
    {
      key: 'closedAt',
      header: 'Cierre',
      sortable: true,
      render: (row: CashRegister) => (
        <div>
          {row.closedAt ? (
            <div>
              <div className="font-medium">{format(new Date(row.closedAt), 'd MMM yyyy', { locale: es })}</div>
              <div className="text-sm text-[var(--unit-text-muted)]">{format(new Date(row.closedAt), 'HH:mm')}</div>
            </div>
          ) : (
            <span className="text-[var(--unit-text-muted)]">Abierta</span>
          )}
        </div>
      ),
    },
    {
      key: 'unit',
      header: 'Unidad',
      render: (row: CashRegister) => (
        <span className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          row.unit === 'SPA'
            ? 'bg-purple-100 text-purple-800'
            : 'bg-amber-100 text-amber-800'
        )}>
          {row.unit === 'BARBERIA' ? 'Barbería' : 'SPA'}
        </span>
      ),
    },
    {
      key: 'openedBy',
      header: 'Abrió',
      render: (row: CashRegister) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-[var(--unit-text-muted)]" />
          <span>{row.openedBy.name}</span>
        </div>
      ),
    },
    {
      key: 'openingAmount',
      header: 'Monto Inicial',
      sortable: true,
      render: (row: CashRegister) => (
        <div className="flex items-center gap-1">
          <DollarSign className="h-4 w-4 text-[var(--unit-text-muted)]" />
          <span className="font-medium">S/ {row.openingAmount.toFixed(2)}</span>
        </div>
      ),
    },
    {
      key: 'totalSales',
      header: 'Ventas',
      sortable: true,
      render: (row: CashRegister) => (
        <div className="flex items-center gap-1">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <span className="font-medium text-green-600">S/ {row.totalSales.toFixed(2)}</span>
        </div>
      ),
    },
    {
      key: 'totalExpenses',
      header: 'Gastos',
      sortable: true,
      render: (row: CashRegister) => (
        <div className="flex items-center gap-1">
          <TrendingDown className="h-4 w-4 text-red-600" />
          <span className="font-medium text-red-600">S/ {row.totalExpenses.toFixed(2)}</span>
        </div>
      ),
    },
    {
      key: 'netAmount',
      header: 'Monto Neto',
      sortable: true,
      render: (row: CashRegister) => (
        <div className="flex items-center gap-1">
          <DollarSign className="h-4 w-4 text-[var(--unit-accent)]" />
          <span className="font-medium text-[var(--unit-accent)]">S/ {row.netAmount.toFixed(2)}</span>
        </div>
      ),
    },
    {
      key: 'difference',
      header: 'Diferencia',
      sortable: true,
      render: (row: CashRegister) => {
        if (row.difference == null) return '—';
        const diff = row.difference;
        const isPositive = diff > 0;
        const isNegative = diff < 0;
        
        return (
          <div className="flex items-center gap-1">
            {isPositive && <TrendingUp className="h-4 w-4 text-red-600" />}
            {isNegative && <TrendingDown className="h-4 w-4 text-green-600" />}
            {!isPositive && !isNegative && <AlertCircle className="h-4 w-4 text-[var(--unit-text-muted)]" />}
            <span className={cn(
              'font-medium',
              isPositive ? 'text-red-600' : isNegative ? 'text-green-600' : 'text-[var(--unit-text)]'
            )}>
              S/ {Math.abs(diff).toFixed(2)}
            </span>
            <span className={cn(
              'text-xs',
              isPositive ? 'text-red-600' : isNegative ? 'text-green-600' : 'text-[var(--unit-text-muted)]'
            )}>
              {isPositive ? 'sobrante' : isNegative ? 'faltante' : 'exacto'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row: CashRegister) => (
        <span className={cn(
          'px-2 py-1 rounded-full text-xs font-medium',
          row.status === 'CLOSED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        )}>
          {row.status === 'CLOSED' ? 'Cerrada' : 'Abierta'}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: 'Ver',
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: CashRegister) => {
        console.log('View cash register', row.id);
      },
      className: 'text-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/10',
    },
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: (row: CashRegister) => {
        console.log('Edit cash register', row.id);
      },
      className: 'text-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/10',
    },
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
    {
      key: 'status',
      label: 'Estado',
      type: 'select' as const,
      options: [
        { label: 'Todos', value: '' },
        { label: 'Abiertas', value: 'OPEN' },
        { label: 'Cerradas', value: 'CLOSED' },
      ],
    },
    {
      key: 'hasDifference',
      label: 'Con Diferencia',
      type: 'checkbox' as const,
    },
  ];

  const displayData = compact ? cashRegisters.slice(0, 5) : cashRegisters;

  return (
    <div>
      <DataTable
        columns={columns}
        data={displayData}
        keyExtractor={(row) => row.id}
        loading={isLoading}
        searchPlaceholder="Buscar por empleado, unidad..."
        filters={filters}
        actions={!compact ? actions : []}
        emptyMessage="No hay cajas en el período seleccionado."
        pageSize={compact ? 5 : 20}
        maxHeight={compact ? "300px" : "500px"}
        pageSizeOptions={compact ? [5] : [10, 20, 50, 100]}
      />
      {compact && cashRegisters.length > 5 && (
        <div className="mt-4 text-center">
          <a href="/reports/cash" className="text-[var(--unit-accent)] hover:underline">
            Ver todas las cajas ({cashRegisters.length} total)
          </a>
        </div>
      )}
    </div>
  );
}
