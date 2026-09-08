'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, subDays, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { getStartOfPeruDay, getEndOfPeruDay, formatPeruDateTime } from '@/utils/peruTime';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Eye, 
  Trash2, 
  User, 
  Phone, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Filter, 
  Search, 
  Loader2, 
  RefreshCw,
  LayoutGrid,
  List,
  BarChart3,
  CheckCircle,
  CreditCard,
  Scissors,
  Sparkles
} from 'lucide-react';
import { api } from '@/lib/api';
import { useUnitStore } from '@/store/unitStore';
import { useAuthStore } from '@/store/authStore';
import { AppointmentDetailDrawer } from './AppointmentDetailDrawer';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { DataTable } from '@/components/ui/DataTable';
import { OptimizedScheduleView } from './OptimizedScheduleView';
import { AppointmentsMetrics } from './AppointmentsMetrics';
import { TableToolbar, type QuickChip } from '@/components/ui/TableToolbar';
import { TableBadge } from '@/components/ui/TableBadge';
import { cn } from '@/lib/utils';
import { STATUS_CONFIG, getStatusConfig, type Appointment, type CalendarAppointmentWithProps } from '@/types/appointment';
import { useToast } from '@/hooks/useToast';

export function AppointmentsPage(): JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const activeUnit = useUnitStore((s) => s.activeUnit);
  const user = useAuthStore((s) => s.user);
  const unit = activeUnit ?? 'SPA';
  const { success, error: toastError } = useToast();

  // Tab View Navigation: schedule | list | metrics
  const [activeTab, setActiveTab] = useState<'schedule' | 'list' | 'metrics'>('schedule');

  const [viewStart, setViewStart] = useState<Date>(() => getStartOfPeruDay(subDays(new Date(), 30)));
  const [viewEnd, setViewEnd] = useState<Date>(() => getEndOfPeruDay(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)));
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  const handleCalendarDateChange = useCallback((date: Date) => {
    setCalendarDate(date);
  }, []);

  const [drawerAppointmentId, setDrawerAppointmentId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<'SPA' | 'BARBERIA' | null>(null);
  const [search, setSearch] = useState('');

  // Date range filter states
  const [dateFrom, setDateFrom] = useState<Date>(getStartOfPeruDay(subDays(new Date(), 30)));
  const [dateTo, setDateTo] = useState<Date>(getEndOfPeruDay(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)));
  const [unitFilter, setUnitFilter] = useState<string>('');

  // Additional filter states
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [serviceFilter, setServiceFilter] = useState<string>('');
  const [employeeFilter, setEmployeeFilter] = useState<string>('');

  const canFilterByEmployee = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST';

  // State for delete confirmation dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointmentWithProps | null>(null);

  // Employees Query
  const { data: employees = [] } = useQuery({
    queryKey: ['users-employees'],
    queryFn: async () => {
      const { data } = await api.get('/api/users/employees');
      return data.map((emp: any) => ({
        id: emp.id,
        name: emp.name,
        unit: emp.unit || 'SPA',
        color: emp.unit === 'BARBERIA' ? '#3B82F6' : '#A855F7'
      }));
    },
  });

  // Services Query
  const { data: servicesList = [] } = useQuery({
    queryKey: ['services-all'],
    queryFn: async () => {
      const { data } = await api.get<{ data: any[] }>('/api/services?activeOnly=false');
      return data.data || [];
    },
  });

  // Unified Appointments Query
  const { data: appointments = [], isLoading, isFetching } = useQuery({
    queryKey: ['appointments', unit, viewStart.toISOString(), viewEnd.toISOString(), unitFilter, dateFrom, dateTo, statusFilter, serviceFilter, canFilterByEmployee ? employeeFilter : null, search],
    queryFn: async (): Promise<Appointment[]> => {
      const params = new URLSearchParams({
        start: viewStart.toISOString(),
        end: viewEnd.toISOString(),
      });

      if (unitFilter) params.set('unit', unitFilter);
      if (dateFrom) params.set('dateFrom', dateFrom.toISOString());
      if (dateTo) params.set('dateTo', dateTo.toISOString());
      if (statusFilter) params.set('status', statusFilter);
      if (serviceFilter) params.set('serviceId', serviceFilter);

      if (employeeFilter && canFilterByEmployee) {
        params.set('employeeId', employeeFilter);
      }

      if (search) params.set('search', search);

      const response = await api.get(`/api/appointments?${params}`);
      return response.data?.data || [];
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      await api.delete(`/api/appointments/${appointmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments-calendar'] });
      success('Cita eliminada exitosamente');
      setShowDeleteDialog(false);
      setSelectedAppointment(null);
    },
    onError: (err: any) => {
      toastError(err?.response?.data?.error || 'Error al eliminar la cita');
    },
  });

  // Schedule Appointments format
  const scheduleAppointments = useMemo(() => {
    return appointments.map((apt: any) => ({
      id: apt.id,
      customer: apt.customer,
      employee: apt.employee,
      service: apt.service || apt.items?.[0]?.service,
      items: apt.items,
      date: apt.date,
      startTime: apt.startTime,
      endTime: apt.endTime,
      duration: apt.durationMin || apt.items?.[0]?.durationMin || 30,
      status: apt.status,
      notes: apt.notes,
      sale: apt.sale,
    }));
  }, [appointments]);

  // Normalized Appointments for DataTable
  const normalizedAppointments = useMemo(() => {
    return appointments.map((apt: any): CalendarAppointmentWithProps => ({
      id: apt.id,
      title: `${apt.customer?.name || 'Sin cliente'} - ${apt.items?.[0]?.service?.name || apt.service?.name || 'Sin servicio'}`,
      start: new Date(apt.startTime),
      end: new Date(apt.endTime),
      extendedProps: {
        appointmentId: apt.id,
        customer: apt.customer,
        service: apt.items?.[0]?.service || apt.service,
        employee: apt.employee,
        unit: apt.unit,
        status: apt.status,
        notes: apt.notes,
        sale: apt.sale,
      }
    }));
  }, [appointments]);

  // Summary Metrics calculation for top micro-bar
  const summaryMetrics = useMemo(() => {
    const todayAppointments = appointments.filter(apt => isToday(new Date(apt.startTime)));
    const inProgress = appointments.filter(apt => apt.status === 'IN_PROGRESS');
    const scheduled = appointments.filter(apt => apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED' || apt.status === 'RESCHEDULED');
    const completed = appointments.filter(apt => apt.status === 'COMPLETED');

    return {
      todayCount: todayAppointments.length,
      inProgressCount: inProgress.length,
      scheduledCount: scheduled.length,
      completedCount: completed.length,
    };
  }, [appointments]);

  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (appointments && appointments.length > 0) {
      setLastUpdate(new Date());
    }
  }, [appointments]);

  const forceRefreshAppointments = useCallback(() => {
    setLastUpdate(new Date());
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
  }, [queryClient]);

  const handleNewAppointment = useCallback((employeeId: string, time: Date, unit: 'SPA' | 'BARBERIA') => {
    const params = new URLSearchParams({
      employeeId,
      unit,
      start: time.toISOString(),
    });
    router.push(`/appointments/new?${params}`);
  }, [router]);

  const handleViewAppointment = useCallback((appointmentId: string) => {
    setDrawerAppointmentId(appointmentId);
    setDrawerOpen(true);
  }, []);

  const handleReschedule = useCallback(async (appointmentId: string, newEmployeeId: string, newTime: Date) => {
    try {
      const appointment = scheduleAppointments.find((apt: any) => apt.id === appointmentId);
      const duration = appointment?.items?.[0]?.durationMin || appointment?.service?.durationMin || 30;
      const endTime = new Date(newTime.getTime() + duration * 60 * 1000);

      await api.patch(`/api/appointments/${appointmentId}`, {
        employeeId: newEmployeeId,
        startTime: newTime.toISOString(),
        endTime: endTime.toISOString(),
        status: 'RESCHEDULED',
      });

      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
      success('Cita reprogramada exitosamente');
    } catch (error) {
      throw error;
    }
  }, [queryClient, scheduleAppointments, success]);

  // Sync selectedUnit with global active unit
  useEffect(() => {
    if (activeUnit && !selectedUnit) {
      setSelectedUnit(activeUnit);
    }
  }, [activeUnit, selectedUnit]);

  // Chips para estado de la cita
  const statusChips: QuickChip[] = [
    { id: '', label: 'Todas' },
    { id: 'SCHEDULED', label: 'Programadas' },
    { id: 'IN_PROGRESS', label: 'En curso' },
    { id: 'COMPLETED', label: 'Finalizadas' },
    { id: 'CANCELLED', label: 'Canceladas' },
  ];

  // Table Columns Definition
  const columns = [
    {
      key: 'startTime',
      header: 'Fecha y Hora',
      sortable: true,
      render: (row: CalendarAppointmentWithProps) => (
        <div className="text-sm">
          <div className="font-semibold text-[var(--unit-text)]">{formatPeruDateTime(row.start)}</div>
          <div className="text-xs text-[var(--unit-text-muted)]">
            Hasta {format(row.end, 'HH:mm')}
          </div>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Cliente',
      render: (row: CalendarAppointmentWithProps) => (
        <div>
          <div className="font-bold text-[var(--unit-text)]">{row.extendedProps.customer?.name || 'Sin cliente'}</div>
          {row.extendedProps.customer?.phone && (
            <div className="text-xs text-[var(--unit-text-muted)]">{row.extendedProps.customer.phone}</div>
          )}
        </div>
      ),
    },
    {
      key: 'service',
      header: 'Servicio',
      render: (row: CalendarAppointmentWithProps) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-xs text-[var(--unit-text)]">
            {row.extendedProps.service?.name || 'Servicio no especificado'}
          </span>
          <span className="text-[11px] text-[var(--unit-text-muted)]">
            {row.extendedProps.service?.durationMin || 30} min
          </span>
        </div>
      ),
    },
    {
      key: 'employee',
      header: 'Especialista',
      render: (row: CalendarAppointmentWithProps) => (
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] flex items-center justify-center text-xs font-bold">
            {row.extendedProps.employee?.name?.charAt(0) || 'E'}
          </div>
          <span className="text-xs font-medium text-[var(--unit-text)]">
            {row.extendedProps.employee?.name || 'No asignado'}
          </span>
        </div>
      ),
    },
    {
      key: 'unit',
      header: 'Unidad',
      render: (row: CalendarAppointmentWithProps) => (
        <TableBadge type={row.extendedProps.unit === 'BARBERIA' ? 'unit-barberia' : 'unit-spa'}>
          {row.extendedProps.unit === 'BARBERIA' ? 'Barbería' : 'SPA'}
        </TableBadge>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row: CalendarAppointmentWithProps) => {
        const status = getStatusConfig(row.extendedProps.status);
        const mappedType = row.extendedProps.status === 'COMPLETED' ? 'status-completed'
                         : row.extendedProps.status === 'IN_PROGRESS' ? 'status-pending'
                         : row.extendedProps.status === 'CANCELLED' || row.extendedProps.status === 'NO_SHOW' ? 'status-cancelled'
                         : 'status-scheduled';
        return (
          <TableBadge type={mappedType}>
            {status.label}
          </TableBadge>
        );
      },
    },
    {
      key: 'sale',
      header: 'Venta / Cobro',
      render: (row: CalendarAppointmentWithProps) => {
        const sale = row.extendedProps.sale;
        if (sale) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5" />
              #{sale.saleNumber}
            </span>
          );
        }
        if (row.extendedProps.status === 'COMPLETED' || row.extendedProps.status === 'IN_PROGRESS') {
          return (
            <Link
              href={`/pos?customerId=${encodeURIComponent(row.extendedProps.customer?.id || '')}&appointmentId=${encodeURIComponent(row.id)}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-unit text-xs font-bold bg-[var(--unit-accent)] text-white hover:bg-[var(--unit-accent)]/90 transition-all"
            >
              <CreditCard className="h-3 w-3" />
              Cobrar
            </Link>
          );
        }
        return (
          <span className="text-xs text-[var(--unit-text-muted)]">—</span>
        );
      },
    },
  ];

  const actions = [
    {
      label: 'Ver detalle',
      variant: 'view' as const,
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: CalendarAppointmentWithProps) => {
        setDrawerAppointmentId(row.id);
        setDrawerOpen(true);
      },
    },
    {
      label: 'Eliminar',
      variant: 'delete' as const,
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: CalendarAppointmentWithProps) => {
        setSelectedAppointment(row);
        setShowDeleteDialog(true);
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--unit-surface)]">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Top Header & Fast Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--unit-border)]/40 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] text-xs font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--unit-accent)] animate-pulse" />
                Gestión Operativa
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--unit-text)] tracking-tight">
              Agenda & Citas
            </h1>
            <p className="text-xs sm:text-sm text-[var(--unit-text-muted)]">
              Control de programaciones, turnos de especialistas y flujo de caja en tiempo real
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={forceRefreshAppointments}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-xs font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-all shadow-unit-sm"
              title="Actualizar datos"
            >
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin text-[var(--unit-accent)]")} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            <Link
              href="/appointments/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-unit bg-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/90 text-white text-xs font-bold transition-all shadow-unit active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Nueva Cita
            </Link>
          </div>
        </div>

        {/* Ergonomic Micro Status Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3">
            <div className="h-9 w-9 rounded-unit bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Citas Hoy</p>
              <p className="text-lg font-bold text-[var(--unit-text)]">{summaryMetrics.todayCount}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3">
            <div className="h-9 w-9 rounded-unit bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">En Curso</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{summaryMetrics.inProgressCount}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3">
            <div className="h-9 w-9 rounded-unit bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Por Atender</p>
              <p className="text-lg font-bold text-[var(--unit-text)]">{summaryMetrics.scheduledCount}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3">
            <div className="h-9 w-9 rounded-unit bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Finalizadas</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{summaryMetrics.completedCount}</p>
            </div>
          </div>
        </div>

        {/* View Switcher (Segmented Tabs) */}
        <div className="flex items-center justify-between border-b border-[var(--unit-border)]/40 pb-2">
          <div className="flex items-center gap-1.5 p-1 rounded-unit-lg bg-[var(--unit-surface-elevated)] border border-[var(--unit-border)]/40">
            <button
              onClick={() => setActiveTab('schedule')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-unit text-xs font-bold transition-all",
                activeTab === 'schedule'
                  ? "bg-[var(--unit-surface)] text-[var(--unit-accent)] shadow-unit-sm border border-[var(--unit-border)]/40"
                  : "text-[var(--unit-text-muted)] hover:text-[var(--unit-text)]"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Rejilla de Horarios
            </button>

            <button
              onClick={() => setActiveTab('list')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-unit text-xs font-bold transition-all",
                activeTab === 'list'
                  ? "bg-[var(--unit-surface)] text-[var(--unit-accent)] shadow-unit-sm border border-[var(--unit-border)]/40"
                  : "text-[var(--unit-text-muted)] hover:text-[var(--unit-text)]"
              )}
            >
              <List className="h-4 w-4" />
              Lista de Citas
            </button>

            <button
              onClick={() => setActiveTab('metrics')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-unit text-xs font-bold transition-all",
                activeTab === 'metrics'
                  ? "bg-[var(--unit-surface)] text-[var(--unit-accent)] shadow-unit-sm border border-[var(--unit-border)]/40"
                  : "text-[var(--unit-text-muted)] hover:text-[var(--unit-text)]"
              )}
            >
              <BarChart3 className="h-4 w-4" />
              Métricas & KPIs
            </button>
          </div>

          <div className="text-[11px] text-[var(--unit-text-muted)] hidden sm:block">
            Última sincro: <span className="font-semibold text-[var(--unit-text)]">{format(lastUpdate, 'HH:mm:ss')}</span>
          </div>
        </div>

        {/* TAB 1: SCHEDULE VIEW */}
        {activeTab === 'schedule' && (
          <div className="rounded-unit-lg border border-[var(--unit-border)]/50 bg-[var(--unit-surface)] p-4 sm:p-6 shadow-unit-sm animate-in fade-in duration-200">
            <OptimizedScheduleView
              date={calendarDate}
              employees={employees}
              appointments={scheduleAppointments as any}
              selectedUnit={selectedUnit}
              onNewAppointment={handleNewAppointment}
              onViewAppointment={handleViewAppointment}
              onReschedule={handleReschedule}
              onDateChange={handleCalendarDateChange}
            />
          </div>
        )}

        {/* TAB 2: LIST VIEW & FILTERS */}
        {activeTab === 'list' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <TableToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por cliente, teléfono, servicio o especialista..."
              chips={statusChips}
              activeChip={statusFilter}
              onChipChange={(id) => setStatusFilter(id as string)}
              showAdvancedFiltersButton={true}
              isAdvancedOpen={showFilters}
              onToggleAdvanced={() => setShowFilters(!showFilters)}
              activeFiltersCount={(serviceFilter ? 1 : 0) + (employeeFilter ? 1 : 0) + (unitFilter ? 1 : 0)}
              onResetFilters={() => {
                setServiceFilter('');
                setEmployeeFilter('');
                setUnitFilter('');
                setDateFrom(getStartOfPeruDay(subDays(new Date(), 30)));
                setDateTo(getEndOfPeruDay(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)));
              }}
              advancedFiltersContent={
                <div className="space-y-4">
                  <DateRangeFilter
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    onDateFromChange={(d) => d && setDateFrom(d)}
                    onDateToChange={(d) => d && setDateTo(d)}
                    unit={unitFilter}
                    onUnitChange={setUnitFilter}
                    showUnitFilter={true}
                    showStatusFilter={false}
                    className="rounded-unit bg-[var(--unit-surface)]"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Service Filter */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[var(--unit-text-muted)] uppercase">Servicio</label>
                      <select
                        value={serviceFilter}
                        onChange={(e) => setServiceFilter(e.target.value)}
                        className="w-full rounded-unit border border-[var(--unit-border)]/60 bg-[var(--unit-surface)] px-3 py-2 text-xs text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/40"
                      >
                        <option value="">Todos los servicios</option>
                        {servicesList.map((service: any) => (
                          <option key={service.id} value={service.id}>
                            {service.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Employee Filter */}
                    {canFilterByEmployee && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[var(--unit-text-muted)] uppercase">Especialista</label>
                        <select
                          value={employeeFilter}
                          onChange={(e) => setEmployeeFilter(e.target.value)}
                          className="w-full rounded-unit border border-[var(--unit-border)]/60 bg-[var(--unit-surface)] px-3 py-2 text-xs text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/40"
                        >
                          <option value="">Todos los especialistas</option>
                          {employees.map((emp: any) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} ({emp.unit})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              }
            />

            {/* Appointments DataTable */}
            <div className="rounded-unit-lg border border-[var(--unit-border)]/50 bg-[var(--unit-surface)] p-5 shadow-unit-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[var(--unit-text)]">Listado General</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--unit-accent)]/10 text-[var(--unit-accent)]">
                    {normalizedAppointments.length} citas
                  </span>
                </div>
              </div>

              <DataTable
                columns={columns}
                data={normalizedAppointments as any}
                keyExtractor={(row) => row.id}
                loading={isLoading}
                searchPlaceholder=""
                filters={[]}
                actions={actions}
                emptyMessage="No se encontraron citas con los criterios seleccionados."
                pageSize={15}
                pageSizeOptions={[10, 15, 30, 50]}
                className="rounded-unit"
              />
            </div>
          </div>
        )}

        {/* TAB 3: METRICS VIEW */}
        {activeTab === 'metrics' && (
          <div className="animate-in fade-in duration-200">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--unit-accent)]" />
                <span className="text-xs font-medium text-[var(--unit-text)]">Calculando métricas de citas...</span>
              </div>
            ) : (
              <AppointmentsMetrics appointments={appointments} />
            )}
          </div>
        )}

        {/* Appointment Detail Drawer */}
        {drawerOpen && (
          <AppointmentDetailDrawer
            appointmentId={drawerAppointmentId}
            open={drawerOpen}
            onClose={() => {
              setDrawerOpen(false);
              setDrawerAppointmentId(null);
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteDialog && selectedAppointment && (
          <div 
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowDeleteDialog(false);
                setSelectedAppointment(null);
              }
            }}
          >
            <div className="relative w-full max-w-md rounded-unit-lg border border-rose-500/30 bg-[var(--unit-surface)] p-6 shadow-unit-lg space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-unit bg-rose-500/10 text-rose-600 border border-rose-500/20">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--unit-text)]">Eliminar Cita</h3>
                  <p className="text-xs text-[var(--unit-text-muted)]">Esta acción es permanente y no se puede deshacer</p>
                </div>
              </div>

              <div className="p-3.5 rounded-unit bg-[var(--unit-surface-elevated)] border border-[var(--unit-border)]/40 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[var(--unit-text-muted)]">Cliente:</span>
                  <span className="font-bold text-[var(--unit-text)]">{selectedAppointment.extendedProps.customer?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--unit-text-muted)]">Fecha y Hora:</span>
                  <span className="font-medium text-[var(--unit-text)]">{formatPeruDateTime(selectedAppointment.start)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--unit-text-muted)]">Servicio:</span>
                  <span className="font-medium text-[var(--unit-text)]">{selectedAppointment.extendedProps.service?.name}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setSelectedAppointment(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-xs font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(selectedAppointment.id)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-unit bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all active:scale-[0.98] shadow-unit-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span>{deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
