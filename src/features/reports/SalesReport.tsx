import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataTable } from '@/components/ui/DataTable';
import { Edit, Eye, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        <a href={`/pos/sales/${row.id}`} className="text-[var(--unit-accent)] hover:underline">
          {row.saleNumber}
        </a>
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
      render: (row: Sale) => row.customer.name,
    },
    {
      key: 'employee',
      header: 'Empleado',
      render: (row: Sale) => row.employee.name,
    },
    {
      key: 'unit',
      header: 'Unidad',
      render: (row: Sale) => (
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
      key: 'paymentMethod',
      header: 'Método',
      render: (row: Sale) => translateBackendTerm(row.paymentMethod),
    },
    {
      key: 'total',
      header: 'Total',
      sortable: true,
      render: (row: Sale) => (
        <span className="font-medium">S/ {row.total.toFixed(2)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row: Sale) => (
        <span className={cn(
          'px-2 py-1 rounded-full text-xs font-medium',
          row.status === 'CLOSED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        )}>
          {translateBackendTerm(row.status)}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: 'Ver',
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: Sale) => {
        window.open(`/pos/sales/${row.id}`, '_blank');
      },
      className: 'text-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/10',
    },
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: (row: Sale) => {
        console.log('Edit sale', row.id);
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
        emptyMessage="No hay ventas en el período seleccionado."
        pageSize={compact ? 5 : 20}
        maxHeight={compact ? "300px" : "500px"}
        pageSizeOptions={compact ? [5] : [10, 20, 50, 100]}
      />
      {compact && sales.length > 5 && (
        <div className="mt-4 text-center">
          <a href="/reports/sales" className="text-[var(--unit-accent)] hover:underline">
            Ver todas las ventas ({sales.length} total)
          </a>
        </div>
      )}
    </div>
  );
}
