'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, startOfDay, endOfDay, isWithinInterval, parseISO, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery, useQueryClient, QueryClient } from '@tanstack/react-query';
import { Clock, Calendar, CheckCircle2, AlertCircle, Plus, Eye, Trash2, User, Phone, ChevronDown, ChevronUp, X, Filter, Search, Loader2, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { useUnitStore } from '@/store/unitStore';
import { useAuthStore } from '@/store/authStore';
import { LazyCalendar } from '@/components/Calendar/LazyCalendar';
import type { CalendarAppointment } from '@/components/Calendar/AppointmentCalendar';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { AppointmentDetailDrawer } from './AppointmentDetailDrawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { DataTable } from '@/components/ui/DataTable';
import { OptimizedScheduleView } from './OptimizedScheduleView';
import { AppointmentsMetrics } from './AppointmentsMetrics';
import { cn } from '@/lib/utils';
import { STATUS_CONFIG, getStatusConfig, type Appointment } from '@/types/appointment';
import { useToast } from '@/hooks/useToast';

const DAY_QUEUE_ROW_HEIGHT = 120;

export function AppointmentsPage(): JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const activeUnit = useUnitStore((s) => s.activeUnit);
  const user = useAuthStore((s) => s.user);
  const unit = activeUnit ?? 'SPA';

  // Función para forzar recarga de citas
  const refreshAppointments = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
  }, [queryClient]);

  const { success } = useToast();
  
  const [viewStart, setViewStart] = useState<Date>(() => startOfDay(subDays(new Date(), 30))); // Start 30 days ago
  const [viewEnd, setViewEnd] = useState<Date>(() => endOfDay(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))); // End 30 days from now
  const [calendarView, setCalendarView] = useState<'timeGridDay' | 'timeGridWeek' | 'dayGridMonth'>('timeGridDay');
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  // Función para manejar cambio de fecha del calendario
  const handleCalendarDateChange = useCallback((date: Date) => {
    setCalendarDate(date);
  }, []);
  const [drawerAppointmentId, setDrawerAppointmentId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<'SPA' | 'BARBERIA' | null>(null);
  const [search, setSearch] = useState('');
  
  // Date range filter states
  const [dateFrom, setDateFrom] = useState<Date>(startOfDay(subDays(new Date(), 30))); // 30 días atrás
  const [dateTo, setDateTo] = useState<Date>(endOfDay(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))); // 30 días en el futuro
  const [unitFilter, setUnitFilter] = useState<string>('');
  
  // Additional filter states
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [serviceFilter, setServiceFilter] = useState<string>('');
  const [employeeFilter, setEmployeeFilter] = useState<string>('');

  // Hide employee filter for BARBER and SPA_SPECIALIST roles
  const canFilterByEmployee = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST';
  
  // State for delete confirmation dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Get real employees from API
  const { data: employees = [] } = useQuery({
    queryKey: ['users-employees'],
    queryFn: async () => {
      const { data } = await api.get('/api/users/employees');
      const processedEmployees = data.map((emp: any) => ({
        id: emp.id,
        name: emp.name,
        unit: emp.unit || 'SPA',
        color: emp.unit === 'BARBERIA' ? '#3B82F6' : '#A855F7'
      }));
      return processedEmployees;
    },
  });

  // Get services for service filter dropdown
  const { data: servicesList = [] } = useQuery({
    queryKey: ['services-all'],
    queryFn: async () => {
      const { data } = await api.get<{ data: any[] }>('/api/services?activeOnly=false');
      return data.data || [];
    },
  });

  // ✅ QUERY UNIFICADA - Reemplaza calendar y table queries
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', unit, viewStart.toISOString(), viewEnd.toISOString(), unitFilter, dateFrom, dateTo, statusFilter, serviceFilter, canFilterByEmployee ? employeeFilter : null, search],
    queryFn: async (): Promise<Appointment[]> => {
      const params = new URLSearchParams({
        start: viewStart.toISOString(),
        end: viewEnd.toISOString(),
      });
      
      if (unitFilter) params.set('unit', unitFilter);
      
      // Additional filters (solo para ADMIN y RECEPTIONIST)
      if (unitFilter) params.set('unitFilter', unitFilter);
      if (dateFrom) params.set('dateFrom', dateFrom.toISOString());
      if (dateTo) params.set('dateTo', dateTo.toISOString());
      if (statusFilter) params.set('status', statusFilter);
      if (serviceFilter) params.set('serviceId', serviceFilter);
      
      // Employee filter solo para ADMIN y RECEPTIONIST
      if (employeeFilter && (user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST')) {
        params.set('employeeId', employeeFilter);
      }
      
      if (search) params.set('search', search);
      
      const response = await api.get(`/api/appointments?${params}`);
      
      // Extract the array from paginated response
      const data = response.data?.data || [];
      
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // Refresco cada 5 minutos
  });

  // Transform appointments for OptimizedScheduleView (Appointment format)
  const scheduleAppointments = useMemo(() => {
    const transformed = appointments.map((apt: any) => {
      return {
        id: apt.id,
        customer: apt.customer,
        employee: apt.employee,
        service: apt.service,
        date: apt.date,
        startTime: apt.startTime,
        endTime: apt.endTime,
        duration: apt.duration,
        status: apt.status,
        notes: apt.notes,
      };
    });
    
    return transformed;
  }, [appointments]);

  // Debug: Ver empleados disponibles

  const normalizedAppointments = useMemo(() => {
    return appointments.map((apt: any) => {
      return {
        id: apt.id,
        title: `${apt.customer?.name || 'Sin cliente'} - ${apt.items?.[0]?.service?.name || 'Sin servicio'}`,
        start: new Date(apt.startTime),
        end: new Date(apt.endTime),
        extendedProps: {
          appointmentId: apt.id,
          customer: apt.customer,
          service: apt.items?.[0]?.service,
          employee: apt.employee, // Usar el empleado directo de la cita
          unit: apt.unit,
          status: apt.status,
          notes: apt.notes
        }
      };
    });
  }, [appointments]);

  // Estado para mostrar última actualización
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Actualizar timestamp cuando se refrescan los datos
  useEffect(() => {
    if (appointments && appointments.length > 0) {
      setLastUpdate(new Date());
    }
  }, [appointments]);

  const forceRefreshAppointments = useCallback(() => {
    setLastUpdate(new Date()); // Update timestamp immediately for feedback
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
  }, [queryClient]);

  
  
  // Handlers for OptimizedScheduleView
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
      // Find the appointment to get its duration from scheduleAppointments
      const appointment = scheduleAppointments.find((apt: any) => apt.id === appointmentId);
      const duration = appointment?.service?.durationMin || 30;
      
      const endTime = new Date(newTime.getTime() + duration * 60 * 1000);
      
      await api.patch(`/api/appointments/${appointmentId}`, {
        employeeId: newEmployeeId,
        startTime: newTime.toISOString(),
        endTime: endTime.toISOString(),
        status: 'RESCHEDULED', // ✅ Agregar status de reprogramación
      });
      
      // ✅ Invalidar queries específicas para actualizar el drawer
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
      queryClient.invalidateQueries({ queryKey: ['appointments-calendar'] });
      success('Cita reprogramada exitosamente');
      
      // ✅ Si el drawer está abierto para esta cita, invalidar para que se actualice
      if (drawerAppointmentId === appointmentId) {
        queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
      }
    } catch (error) {
      throw error; // Re-throw to let OptimizedScheduleView handle the revert
    }
  }, [queryClient, scheduleAppointments, drawerAppointmentId]);

  // Listen for calendar filter changes from Header
  useEffect(() => {
    const handleCalendarFilterChange = (event: CustomEvent) => {
      const { unit } = event.detail;
      setSelectedUnit(unit);
    };

    window.addEventListener('calendarFilterChange', handleCalendarFilterChange as EventListener);
    
    return () => {
      window.removeEventListener('calendarFilterChange', handleCalendarFilterChange as EventListener);
    };
  }, []);

  // Sync selectedUnit with global active unit on mount and when activeUnit changes
  useEffect(() => {
    if (activeUnit && !selectedUnit) {
      setSelectedUnit(activeUnit);
    }
  }, [activeUnit, selectedUnit]);

  const columns = [
    {
      key: 'startTime',
      header: 'Fecha y Hora',
      sortable: true,
      render: (row: any) => {
        const date = new Date(row.start);
        // Custom formatting for "2 mar. 2026" and "1:00 p. m."
        const day = format(date, 'd');
        const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        const month = monthNames[date.getMonth()];
        const year = format(date, 'yyyy');
        
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'p. m.' : 'a. m.';
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes.toString().padStart(2, '0');

        return (
          <div className="flex flex-col gap-1">
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800">
              {day} {month}. {year}
            </span>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-800">
              {displayHours}:{displayMinutes} {ampm}
            </span>
          </div>
        );
      },
    },
    {
      key: 'customer',
      header: 'Cliente',
      render: (row: any) => (
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-pink-100 text-pink-800">
            {row.extendedProps.customer?.name || 'Sin cliente'}
          </span>
          {row.extendedProps.customer?.phone && (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-sky-100 text-sky-800">
              {row.extendedProps.customer.phone}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'service',
      header: 'Servicio',
      render: (row: any) => {
        const serviceName = row.extendedProps.service?.name;
        const serviceId = row.extendedProps.appointmentId;
        return (
          <div className="flex flex-col gap-1">
            {serviceName ? (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-800">
                {serviceName}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
                Servicio no encontrado
              </span>
            )}
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
              {row.extendedProps.service?.durationMin || 0} min
            </span>
          </div>
        );
      },
    },
    {
      key: 'employee',
      header: 'Empleado',
      render: (row: any) => {
        const employeeName = row.employee?.name;
        const employeeId = (row as any).employeeId;
        return (
          <div className="flex flex-col gap-1">
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800">
              {employeeName || 'Empleado no asignado'}
            </span>
            {employeeId && !employeeName && (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 font-mono">
                ID: {employeeId.slice(0, 8)}...
              </span>
            )}
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-800">
              {row.unit === 'BARBERIA' ? 'Barbería' : 'SPA'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'unit',
      header: 'Unidad',
      render: (row: Appointment) => (
        <span className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          row.unit === 'SPA'
            ? 'bg-purple-100 text-purple-800'
            : 'bg-red-100 text-red-800'
        )}>
          {row.unit === 'BARBERIA' ? 'Barbería' : 'SPA'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row: Appointment) => {
        const status = getStatusConfig(row.status);
        return (
          <span className={cn('px-2 py-1 rounded-full text-xs font-medium', status.bg, status.text)}>
            {status.label}
          </span>
        );
      },
    },
    {
      key: 'sale',
      header: 'Venta',
      render: (row: Appointment) => (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800">
          {row.sale?.saleNumber ? `#${row.sale.saleNumber}` : 'Sin venta'}
        </span>
      ),
    },
  ];

  const filters = [
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

  const actions = [
    {
      label: 'Ver',
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: Appointment) => {
        setDrawerAppointmentId(row.id);
        setDrawerOpen(true);
      },
      className: 'text-blue-600 hover:bg-blue-50',
    },
    {
      label: 'Eliminar',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: Appointment) => {
        setSelectedAppointment(row);
        setShowDeleteDialog(true);
      },
      className: 'text-red-600 hover:bg-red-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--unit-surface)] via-[var(--unit-surface-elevated)] to-[var(--unit-surface)]">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto p-6">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-4">
              <div className="h-2 w-2 rounded-full bg-[var(--unit-accent)] animate-pulse"></div>
              <span className="text-sm font-medium text-[var(--unit-text)]">
                Sistema de Citas
              </span>
            </div>
            <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">Agenda</h1>
            <p className="text-[var(--unit-text-muted)]">
              Gestiona citas y programaciones con control total
            </p>
          </div>

          {/* Appointments Metrics */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--unit-accent)]" />
              <span className="ml-2 text-[var(--unit-text)]">Cargando métricas...</span>
            </div>
          ) : (
            <AppointmentsMetrics appointments={appointments} />
          )}

          {/* Enhanced Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4">
            <Link href="/appointments/new" className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white font-bold shadow-lg border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto">
              <Plus className="h-5 w-5" />
              Nueva Cita
            </Link>
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl border-2 border-[var(--unit-accent)]/50 text-[var(--unit-accent)] font-bold bg-[var(--unit-surface)] hover:bg-[var(--unit-accent)] hover:text-white transition-all hover:shadow-lg active:scale-[0.98] w-full sm:w-auto"
            >
              <Calendar className="h-5 w-5" />
              {showCalendar ? 'Ocultar' : 'Mostrar'} Calendario
            </button>
            <button
              onClick={forceRefreshAppointments}
              className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl border-2 border-[var(--unit-border)]/50 text-[var(--unit-text)] font-bold bg-[var(--unit-surface)] hover:bg-[var(--unit-text)] hover:text-[var(--unit-surface)] transition-all hover:shadow-lg active:scale-[0.98] w-full sm:w-auto"
              title="Forzar actualización de citas"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5" />
              )}
              Actualizar
            </button>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 w-full sm:w-auto">
              <span className="text-xs text-[var(--unit-text)]">Última:</span>
              <span className="text-xs font-bold text-[var(--unit-accent)]">{format(lastUpdate, 'HH:mm:ss')}</span>
            </div>
          </div>
        </div>

        {/* Calendar */}
        {showCalendar && (
          <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6 mb-8">
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

        {/* Enhanced Appointments Filters */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6 mb-8">
          {/* Filter Header */}
          <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Filtros de Citas</h3>
                  <p className="text-sm text-[var(--unit-text-muted)]">Refina tu búsqueda</p>
                </div>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-[var(--unit-border)]/30 bg-[var(--unit-surface)] hover:bg-[var(--unit-surface-elevated)] transition-all"
              >
                {showFilters ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Ocultar filtros
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Mostrar filtros
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Filter Content - Conditional Rendering */}
          {showFilters && (
            <div className="space-y-6">
              {/* Date Range Filter */}
              <DateRangeFilter
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={(date: Date | null) => date && setDateFrom(date)}
                onDateToChange={(date: Date | null) => date && setDateTo(date)}
                unit={unitFilter}
                onUnitChange={setUnitFilter}
                showUnitFilter={true}
                showStatusFilter={false}
                className="rounded-xl"
              />

              {/* Additional Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Estado</label>
                  <select
                    value={statusFilter}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">Todos los estados</option>
                    <option value="SCHEDULED">Programadas</option>
                    <option value="IN_PROGRESS">En curso</option>
                    <option value="COMPLETED">Completadas</option>
                    <option value="CANCELLED">Canceladas</option>
                    <option value="NO_SHOW">No asistió</option>
                  </select>
                </div>

                {/* Service Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Servicio</label>
                  <select
                    value={serviceFilter}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                    onChange={(e) => setServiceFilter(e.target.value)}
                  >
                    <option value="">Todos los servicios</option>
                    {servicesList.map((service: any) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Employee Filter - Solo para ADMIN y RECEPTIONIST */}
                {canFilterByEmployee && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Empleado</label>
                    <select
                      value={employeeFilter}
                      className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                      onChange={(e) => {
                        setEmployeeFilter(e.target.value);
                      }}
                    >
                      <option value="">Todos los empleados</option>
                      {employees.map((employee: any) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Enhanced Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-[var(--unit-text-muted)]" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por cliente, servicio, empleado..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                  }}
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 pl-12 pr-12 py-4 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all placeholder:text-[var(--unit-text-muted)]/50"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--unit-accent)] text-white hover:bg-[var(--unit-accent)]/80 transition-colors">
                      <X className="h-3 w-3" />
                    </div>
                  </button>
                )}
              </div>

              {/* Enhanced Active Filters Summary */}
              {(statusFilter || serviceFilter || (employeeFilter && canFilterByEmployee) || search || unitFilter) && (
                <div className="rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Filtros activos:</span>
                      <div className="flex flex-wrap gap-2">
                        {statusFilter && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-200">
                            Estado: {statusFilter === 'SCHEDULED' ? 'Programadas' : 
                                    statusFilter === 'IN_PROGRESS' ? 'En curso' :
                                    statusFilter === 'COMPLETED' ? 'Completadas' :
                                    statusFilter === 'CANCELLED' ? 'Canceladas' :
                                    statusFilter === 'NO_SHOW' ? 'No asistió' : statusFilter}
                          </span>
                        )}
                        {serviceFilter && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 border border-purple-200">
                            Servicio: {servicesList.find((s: any) => s.id === serviceFilter)?.name || serviceFilter}
                          </span>
                        )}
                        {employeeFilter && canFilterByEmployee && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 border border-green-200">
                            Empleado: {employees.find((e: any) => e.id === employeeFilter)?.name || employeeFilter}
                          </span>
                        )}
                        {unitFilter && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                            Unidad: {unitFilter === 'SPA' ? 'SPA' : 'Barbería'}
                          </span>
                        )}
                        {search && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                            Búsqueda: {search}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setStatusFilter('');
                        setServiceFilter('');
                        if (canFilterByEmployee) setEmployeeFilter('');
                        setSearch('');
                        setUnitFilter('');
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--unit-accent)] hover:bg-[var(--unit-accent)] hover:text-white rounded-xl border-2 border-[var(--unit-accent)]/50 transition-all"
                    >
                      <X className="h-4 w-4" />
                      Limpiar filtros
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enhanced Appointments Table */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6">
          {/* Table Header */}
          <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Lista de Citas</h3>
                  <p className="text-sm text-[var(--unit-text-muted)]">Historial completo de citas</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-[var(--unit-accent)]/20 px-3 py-1.5 text-sm font-bold text-[var(--unit-accent)] border border-[var(--unit-accent)]/30 shadow-sm">
                  {normalizedAppointments.length} citas
                </span>
              </div>
            </div>
          </div>

          {/* Enhanced Table */}
          <DataTable
            columns={columns}
            data={normalizedAppointments as any}
            keyExtractor={(row) => row.id}
            loading={isLoading}
            searchPlaceholder=""
            filters={[]}
            actions={actions}
            emptyMessage="No se encontraron citas con los filtros aplicados."
            pageSize={15}
            pageSizeOptions={[10, 15, 30, 50]}
            className="rounded-xl"
          />
        </div>

        {/* Enhanced Drawer */}
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

        {/* Delete Confirmation Modal - Estilo Original Premium */}
        {showDeleteDialog && selectedAppointment && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteDialog(false);
              setSelectedAppointment(null);
            }
          }}>
            <div className="relative overflow-hidden rounded-2xl border-2 border-red-500/50 bg-gradient-to-br from-red-50/95 to-red-100/85 backdrop-blur-md shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-30 pointer-events-none">
                <div className="h-full w-full bg-repeat" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ef4444' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
              </div>

              {/* Header */}
              <div className="relative flex items-center gap-4 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                  <Trash2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-900">Eliminar Cita</h3>
                  <p className="text-sm text-red-700">Esta acción es permanente</p>
                </div>
              </div>

              {/* Content */}
              <div className="relative space-y-4">
                <div className="rounded-xl border-2 border-red-200/50 bg-gradient-to-br from-red-50 to-red-100 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 shadow-lg mt-1">
                      <AlertCircle className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-red-900">
                        ¿Estás seguro de que deseas eliminar la cita de "{selectedAppointment.customer?.name}"?
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        Esta acción no se puede deshacer y se perderá toda la información de la cita.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Appointment Info */}
                <div className="rounded-xl border-2 border-red-200/30 bg-gradient-to-br from-white/50 to-white/30 p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Cliente</span>
                      <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                        {selectedAppointment.customer?.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Fecha</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(selectedAppointment.startTime).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Hora</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(selectedAppointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Estado</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedAppointment.status === 'SCHEDULED' ? 'Programada' : selectedAppointment.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setSelectedAppointment(null);
                  }}
                  className="flex-1 rounded-xl border-2 border-red-300/50 px-6 py-3 text-sm font-medium text-red-700 bg-white/80 hover:bg-red-50 transition-all hover:shadow-lg active:scale-[0.98]"
                >
                  Cancelar
                </button>
                <button
                  onClick={refreshAppointments}
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold shadow-lg border-2 border-green-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  <RefreshCw className="h-5 w-5" />
                  Actualizar Citas
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement delete appointment mutation
                    setShowDeleteDialog(false);
                    setSelectedAppointment(null);
                  }}
                  className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold shadow-lg border-2 border-red-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Eliminar Cita
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
