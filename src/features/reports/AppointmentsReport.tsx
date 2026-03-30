import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataTable } from '@/components/ui/DataTable';
import { Edit, Eye, Calendar, User, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  unit: 'SPA' | 'BARBERIA';
  customer: { name: string; phone?: string };
  employee: { name: string };
  service: { name: string };
}

interface AppointmentsReportProps {
  unit: string;
  dateFrom: Date;
  dateTo: Date;
  compact?: boolean;
}

export function AppointmentsReport({ unit, dateFrom, dateTo, compact = false }: AppointmentsReportProps): JSX.Element {
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['report-appointments', unit, dateFrom, dateTo],
    queryFn: async (): Promise<Appointment[]> => {
      const params = new URLSearchParams({
        unit: unit || '',
        from: dateFrom.toISOString(),
        to: dateTo.toISOString(),
      });
      const { data } = await api.get<Appointment[]>(`/api/reports/appointments?${params}`);
      return data;
    },
  });

  const translateBackendTerm = (term: string): string => {
    const statuses: Record<string, string> = {
      'COMPLETED': 'Completada',
      'CANCELLED': 'Cancelada',
      'NO_SHOW': 'No asistió',
      'RESCHEDULED': 'Reprogramada',
      'CONFIRMED': 'Confirmada',
      'SCHEDULED': 'Programada',
      'IN_PROGRESS': 'En curso',
    };

    return statuses[term] || term;
  };

  const columns = [
    {
      key: 'startTime',
      header: 'Fecha y Hora',
      sortable: true,
      render: (row: Appointment) => (
        <div>
          <div className="font-medium">{format(new Date(row.startTime), 'd MMM yyyy', { locale: es })}</div>
          <div className="text-sm text-[var(--unit-text-muted)]">{format(new Date(row.startTime), 'HH:mm')}</div>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Cliente',
      render: (row: Appointment) => (
        <div>
          <div className="flex items-center gap-2">
            <User className="h-3 w-3 text-[var(--unit-text-muted)]" />
            <span className="font-medium">{row.customer.name}</span>
          </div>
          {row.customer.phone && (
            <div className="flex items-center gap-1 text-sm text-[var(--unit-text-muted)]">
              <Phone className="h-3 w-3" />
              {row.customer.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'service',
      header: 'Servicio',
      render: (row: Appointment) => row.service.name,
    },
    {
      key: 'employee',
      header: 'Empleado',
      render: (row: Appointment) => row.employee.name,
    },
    {
      key: 'unit',
      header: 'Unidad',
      render: (row: Appointment) => (
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
      key: 'status',
      header: 'Estado',
      render: (row: Appointment) => (
        <span className={cn(
          'px-2 py-1 rounded-full text-xs font-medium',
          row.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
          row.status === 'CANCELLED' || row.status === 'NO_SHOW' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
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
      onClick: (row: Appointment) => {
        // TODO: Implement view appointment functionality
      },
      className: 'text-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/10',
    },
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: (row: Appointment) => {
        // TODO: Implement edit appointment functionality
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
        { label: 'Programadas', value: 'SCHEDULED' },
        { label: 'En curso', value: 'IN_PROGRESS' },
        { label: 'Completadas', value: 'COMPLETED' },
        { label: 'Canceladas', value: 'CANCELLED' },
        { label: 'No asistió', value: 'NO_SHOW' },
      ],
    },
  ];

  const displayData = compact ? appointments.slice(0, 5) : appointments;

  return (
    <div>
      <DataTable
        columns={columns}
        data={displayData}
        keyExtractor={(row) => row.id}
        loading={isLoading}
        searchPlaceholder="Buscar por cliente, servicio, empleado..."
        filters={filters}
        actions={!compact ? actions : []}
        emptyMessage="No hay citas en el período seleccionado. Intenta ajustar las fechas o los filtros de servicio."
        pageSize={compact ? 5 : 20}
        maxHeight={compact ? "300px" : "500px"}
        pageSizeOptions={compact ? [5] : [10, 20, 50, 100]}
      />
      {compact && appointments.length > 5 && (
        <div className="mt-4 text-center">
          <a href="/reports/appointments" className="text-[var(--unit-accent)] hover:underline">
            Ver todas las citas ({appointments.length} total)
          </a>
        </div>
      )}
    </div>
  );
}
