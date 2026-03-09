import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataTable } from '@/components/ui/DataTable';
import { Edit, Eye, Calculator, User, DollarSign, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Commission {
  id: string;
  userId: string;
  user: { name: string };
  period: string;
  totalSales: number;
  commissionAmount: number;
  commissionPct: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  paidAt?: string;
  createdAt: string;
  paidBy?: { name: string };
}

interface CommissionsReportProps {
  unit: string;
  dateFrom: Date;
  dateTo: Date;
  compact?: boolean;
}

export function CommissionsReport({ unit, dateFrom, dateTo, compact = false }: CommissionsReportProps): JSX.Element {
  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ['report-commissions', unit, dateFrom, dateTo],
    queryFn: async (): Promise<Commission[]> => {
      const params = new URLSearchParams({
        unit: unit || '',
        from: dateFrom.toISOString(),
        to: dateTo.toISOString(),
      });
      const { data } = await api.get<Commission[]>(`/api/reports/commissions?${params}`);
      return data;
    },
  });

  const columns = [
    {
      key: 'user',
      header: 'Empleado',
      sortable: true,
      render: (row: Commission) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-[var(--unit-text-muted)]" />
          <span className="font-medium">{row.user.name}</span>
        </div>
      ),
    },
    {
      key: 'period',
      header: 'Período',
      sortable: true,
      render: (row: Commission) => (
        <div className="text-sm">
          {row.period}
        </div>
      ),
    },
    {
      key: 'totalSales',
      header: 'Ventas Totales',
      sortable: true,
      render: (row: Commission) => (
        <div className="flex items-center gap-1">
          <DollarSign className="h-4 w-4 text-[var(--unit-text-muted)]" />
          <span className="font-medium">S/ {row.totalSales.toFixed(2)}</span>
        </div>
      ),
    },
    {
      key: 'commissionPct',
      header: '% Comisión',
      sortable: true,
      render: (row: Commission) => (
        <span className="font-medium">{row.commissionPct}%</span>
      ),
    },
    {
      key: 'commissionAmount',
      header: 'Monto Comisión',
      sortable: true,
      render: (row: Commission) => (
        <div className="flex items-center gap-1">
          <Calculator className="h-4 w-4 text-[var(--unit-accent)]" />
          <span className="font-medium text-[var(--unit-accent)]">S/ {row.commissionAmount.toFixed(2)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row: Commission) => (
        <span className={cn(
          'px-2 py-1 rounded-full text-xs font-medium',
          row.status === 'PAID' ? 'bg-green-100 text-green-800' :
          row.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        )}>
          {row.status === 'PAID' ? 'Pagada' :
           row.status === 'PENDING' ? 'Pendiente' : 'Cancelada'}
        </span>
      ),
    },
    {
      key: 'paidAt',
      header: 'Fecha Pago',
      sortable: true,
      render: (row: Commission) => (
        <div className="text-sm">
          {row.paidAt ? (
            <div>
              <div>{format(new Date(row.paidAt), 'd MMM yyyy', { locale: es })}</div>
              {row.paidBy && (
                <div className="text-xs text-[var(--unit-text-muted)]">Por: {row.paidBy.name}</div>
              )}
            </div>
          ) : (
            <span className="text-[var(--unit-text-muted)]">No pagada</span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Creada',
      sortable: true,
      render: (row: Commission) => (
        <div className="text-sm">
          {format(new Date(row.createdAt), 'd MMM yyyy', { locale: es })}
        </div>
      ),
    },
  ];

  const actions = [
    {
      label: 'Ver',
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: Commission) => {
        console.log('View commission', row.id);
      },
      className: 'text-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/10',
    },
    {
      label: 'Pagar',
      icon: <DollarSign className="h-4 w-4" />,
      onClick: (row: Commission) => {
        if (row.status === 'PENDING') {
          console.log('Pay commission', row.id);
        }
      },
      className: 'text-green-600 hover:bg-green-100',
      disabled: (row: Commission) => row.status !== 'PENDING',
    },
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: (row: Commission) => {
        console.log('Edit commission', row.id);
      },
      className: 'text-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/10',
    },
  ];

  const filters = [
    {
      key: 'status',
      label: 'Estado',
      type: 'select' as const,
      options: [
        { label: 'Todos', value: '' },
        { label: 'Pendientes', value: 'PENDING' },
        { label: 'Pagadas', value: 'PAID' },
        { label: 'Canceladas', value: 'CANCELLED' },
      ],
    },
    {
      key: 'period',
      label: 'Período',
      type: 'select' as const,
      options: [
        { label: 'Todos', value: '' },
        { label: 'Enero 2024', value: '2024-01' },
        { label: 'Diciembre 2023', value: '2023-12' },
        // TODO: Generate dynamically
      ],
    },
  ];

  const displayData = compact ? commissions.slice(0, 5) : commissions;

  return (
    <div>
      <DataTable
        columns={columns}
        data={displayData}
        keyExtractor={(row) => row.id}
        loading={isLoading}
        searchPlaceholder="Buscar por empleado, período..."
        filters={filters}
        actions={!compact ? actions : []}
        emptyMessage="No hay comisiones en el período seleccionado."
        pageSize={compact ? 5 : 20}
        maxHeight={compact ? "300px" : "500px"}
        pageSizeOptions={compact ? [5] : [10, 20, 50, 100]}
      />
      {compact && commissions.length > 5 && (
        <div className="mt-4 text-center">
          <a href="/reports/commissions" className="text-[var(--unit-accent)] hover:underline">
            Ver todas las comisiones ({commissions.length} total)
          </a>
        </div>
      )}
    </div>
  );
}
