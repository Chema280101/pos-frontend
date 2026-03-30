import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataTable } from '@/components/ui/DataTable';
import { Edit, Eye, User, Phone, Mail, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  gender?: string;
  totalSpent: number;
  visitCount: number;
  lastVisit?: string;
  createdAt: string;
  isBlocked: boolean;
  preferredEmployee?: { name: string };
}

interface ClientsReportProps {
  unit: string;
  dateFrom: Date;
  dateTo: Date;
  compact?: boolean;
}

export function ClientsReport({ unit, dateFrom, dateTo, compact = false }: ClientsReportProps): JSX.Element {
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['report-clients', unit, dateFrom, dateTo],
    queryFn: async (): Promise<Client[]> => {
      const params = new URLSearchParams({
        unit: unit || '',
        from: dateFrom.toISOString(),
        to: dateTo.toISOString(),
      });
      const { data } = await api.get<Client[]>(`/api/reports/clients?${params}`);
      return data;
    },
  });

  const columns = [
    {
      key: 'name',
      header: 'Cliente',
      sortable: true,
      render: (row: Client) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-[var(--unit-text-muted)]" />
          <div>
            <div className="font-medium">{row.name}</div>
            {row.isBlocked && (
              <span className="text-xs text-red-600">Bloqueado</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contacto',
      render: (row: Client) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm">
            <Phone className="h-3 w-3 text-[var(--unit-text-muted)]" />
            {row.phone}
          </div>
          {row.email && (
            <div className="flex items-center gap-1 text-sm text-[var(--unit-text-muted)]">
              <Mail className="h-3 w-3" />
              {row.email}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'visitCount',
      header: 'Visitas',
      sortable: true,
      render: (row: Client) => (
        <span className="font-medium">{row.visitCount}</span>
      ),
    },
    {
      key: 'totalSpent',
      header: 'Total Gastado',
      sortable: true,
      render: (row: Client) => (
        <span className="font-medium">S/ {row.totalSpent.toFixed(2)}</span>
      ),
    },
    {
      key: 'avgTicket',
      header: 'Ticket Promedio',
      sortable: true,
      render: (row: Client) => (
        <span className="text-sm">
          S/ {row.visitCount > 0 ? (row.totalSpent / row.visitCount).toFixed(2) : '0.00'}
        </span>
      ),
    },
    {
      key: 'lastVisit',
      header: 'Última Visita',
      sortable: true,
      render: (row: Client) => (
        <div className="text-sm">
          {row.lastVisit ? format(new Date(row.lastVisit), 'd MMM yyyy', { locale: es }) : 'Nunca'}
        </div>
      ),
    },
    {
      key: 'preferredEmployee',
      header: 'Empleado Preferido',
      render: (row: Client) => row.preferredEmployee?.name || '—',
    },
  ];

  const actions = [
    {
      label: 'Ver',
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: Client) => {
        // TODO: Implement view client functionality
      },
      className: 'text-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/10',
    },
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: (row: Client) => {
        // TODO: Implement edit client functionality
      },
      className: 'text-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/10',
    },
  ];

  const filters = [
    {
      key: 'gender',
      label: 'Género',
      type: 'select' as const,
      options: [
        { label: 'Todos', value: '' },
        { label: 'Masculino', value: 'M' },
        { label: 'Femenino', value: 'F' },
        { label: 'Otro', value: 'O' },
      ],
    },
    {
      key: 'isBlocked',
      label: 'Estado',
      type: 'checkbox' as const,
    },
  ];

  const displayData = compact ? clients.slice(0, 5) : clients;

  return (
    <div>
      <DataTable
        columns={columns}
        data={displayData}
        keyExtractor={(row) => row.id}
        loading={isLoading}
        searchPlaceholder="Buscar por nombre, teléfono, email..."
        filters={filters}
        actions={!compact ? actions : []}
        emptyMessage="No hay clientes en el período seleccionado. Considera ampliar el rango de fechas."
        pageSize={compact ? 5 : 20}
        maxHeight={compact ? "300px" : "500px"}
        pageSizeOptions={compact ? [5] : [10, 20, 50, 100]}
      />
      {compact && clients.length > 5 && (
        <div className="mt-4 text-center">
          <a href="/reports/clients" className="text-[var(--unit-accent)] hover:underline">
            Ver todos los clientes ({clients.length} total)
          </a>
        </div>
      )}
    </div>
  );
}
