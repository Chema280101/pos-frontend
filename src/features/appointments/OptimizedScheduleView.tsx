'use client';

import { useState, useMemo, useEffect } from 'react';
import { format, isWithinInterval, startOfDay, endOfDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Plus, 
  Clock, 
  User, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Scissors, 
  Sparkles, 
  CheckCircle,
  AlertTriangle,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Appointment } from '@/types/appointment';
import { useToast } from '@/hooks/useToast';

const DEBOUNCE_MS = 300;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

interface Employee {
  id: string;
  name: string;
  unit: 'SPA' | 'BARBERIA';
  avatar?: string;
  color?: string;
}

interface OptimizedScheduleViewProps {
  date: Date;
  employees: Employee[];
  appointments: Appointment[];
  selectedUnit?: 'SPA' | 'BARBERIA' | null;
  onNewAppointment: (employeeId: string, time: Date, unit: 'SPA' | 'BARBERIA') => void;
  onViewAppointment: (appointmentId: string) => void;
  onReschedule: (appointmentId: string, newEmployeeId: string, newTime: Date) => void;
  onDateChange?: (date: Date) => void;
}

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

// Accessible status styling matching WCAG AA
const statusCardStyles: Record<string, { bg: string; text: string; border: string; badgeBg: string; badgeText: string }> = {
  SCHEDULED: {
    bg: 'bg-blue-50/90 dark:bg-blue-950/40',
    text: 'text-blue-950 dark:text-blue-100',
    border: 'border-blue-300 dark:border-blue-700/60',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/60',
    badgeText: 'text-blue-700 dark:text-blue-300',
  },
  CONFIRMED: {
    bg: 'bg-teal-50/90 dark:bg-teal-950/40',
    text: 'text-teal-950 dark:text-teal-100',
    border: 'border-teal-300 dark:border-teal-700/60',
    badgeBg: 'bg-teal-100 dark:bg-teal-900/60',
    badgeText: 'text-teal-700 dark:text-teal-300',
  },
  IN_PROGRESS: {
    bg: 'bg-amber-50/95 dark:bg-amber-950/50',
    text: 'text-amber-950 dark:text-amber-100',
    border: 'border-amber-400 dark:border-amber-600',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/70',
    badgeText: 'text-amber-800 dark:text-amber-200',
  },
  COMPLETED: {
    bg: 'bg-emerald-50/90 dark:bg-emerald-950/40',
    text: 'text-emerald-950 dark:text-emerald-100',
    border: 'border-emerald-300 dark:border-emerald-700/60',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/60',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
  },
  CANCELLED: {
    bg: 'bg-rose-50/80 dark:bg-rose-950/30',
    text: 'text-rose-950 dark:text-rose-200',
    border: 'border-rose-300 dark:border-rose-800/50',
    badgeBg: 'bg-rose-100 dark:bg-rose-900/50',
    badgeText: 'text-rose-700 dark:text-rose-300',
  },
  NO_SHOW: {
    bg: 'bg-slate-100/90 dark:bg-slate-900/40',
    text: 'text-[var(--unit-text)] dark:text-slate-200',
    border: 'border-[var(--unit-border)] dark:border-slate-700/60',
    badgeBg: 'bg-slate-200 dark:bg-slate-800',
    badgeText: 'text-[var(--unit-text)] dark:text-slate-300',
  },
  RESCHEDULED: {
    bg: 'bg-purple-50/90 dark:bg-purple-950/40',
    text: 'text-purple-950 dark:text-purple-100',
    border: 'border-purple-300 dark:border-purple-700/60',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/60',
    badgeText: 'text-purple-700 dark:text-purple-300',
  },
};

export function OptimizedScheduleView({
  date,
  employees,
  appointments,
  selectedUnit,
  onNewAppointment,
  onViewAppointment,
  onReschedule,
  onDateChange,
}: OptimizedScheduleViewProps) {
  const [selectedDate, setSelectedDate] = useState(date);
  const [draggedAppointment, setDraggedAppointment] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ employeeId: string; time: string } | null>(null);
  const { success } = useToast();

  const debouncedSelectedDate = useDebouncedValue(selectedDate, DEBOUNCE_MS);

  useEffect(() => {
    setSelectedDate(date);
  }, [date]);

  useEffect(() => {
    if (debouncedSelectedDate.getTime() !== date.getTime()) {
      onDateChange?.(debouncedSelectedDate);
    }
  }, [debouncedSelectedDate, date, onDateChange]);

  // Group employees by unit
  const employeesByUnit = useMemo(() => {
    return {
      SPA: employees.filter(emp => emp.unit === 'SPA'),
      BARBERIA: employees.filter(emp => emp.unit === 'BARBERIA'),
    };
  }, [employees]);

  // Filter appointments for selected date
  const dayAppointments = useMemo(() => {
    if (!Array.isArray(appointments)) return [];
    
    return appointments.filter((apt) => {
      const appointmentDate = new Date(apt.startTime);
      return isWithinInterval(appointmentDate, {
        start: startOfDay(selectedDate),
        end: endOfDay(selectedDate),
      });
    });
  }, [appointments, selectedDate]);

  // Helper to get true duration in minutes
  const getAppointmentDurationMinutes = (apt: Appointment): number => {
    const itemDuration = apt.items?.[0]?.durationMin || apt.items?.[0]?.service?.durationMin;
    if (itemDuration && Number(itemDuration) > 0) return Number(itemDuration);
    if ((apt as any).service?.durationMin && Number((apt as any).service.durationMin) > 0) {
      return Number((apt as any).service.durationMin);
    }
    return 30;
  };

  // Group appointments by employee and start time
  const scheduleGrid = useMemo(() => {
    const grid: Record<string, Record<string, Appointment | null>> = {};
    
    employees.forEach(emp => {
      grid[emp.id] = {};
      TIME_SLOTS.forEach(time => {
        grid[emp.id][time] = null;
      });
    });

    dayAppointments.forEach(apt => {
      const startTime = format(new Date(apt.startTime), 'HH:mm');
      const employeeId = apt.employee?.id || apt.employeeId || (apt as any).items?.[0]?.employeeId;
       
      if (employeeId && grid[employeeId] && grid[employeeId][startTime] === null) {
        grid[employeeId][startTime] = apt;
      }
    });

    return grid;
  }, [dayAppointments, employees]);

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleTimeSlotClick = (employeeId: string, time: string, unit: 'SPA' | 'BARBERIA') => {
    const [hours, minutes] = time.split(':').map(Number);
    const slotDate = new Date(selectedDate);
    slotDate.setHours(hours, minutes, 0, 0);
    onNewAppointment(employeeId, slotDate, unit);
  };

  const handleDragStart = (appointmentId: string) => {
    setDraggedAppointment(appointmentId);
  };

  const handleDragOver = (e: React.DragEvent, employeeId: string, time: string) => {
    e.preventDefault();
    setDragOverSlot({ employeeId, time });
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = async (e: React.DragEvent, employeeId: string, time: string) => {
    e.preventDefault();
    setDragOverSlot(null);

    if (draggedAppointment) {
      const [hours, minutes] = time.split(':').map(Number);
      const newTime = new Date(selectedDate);
      newTime.setHours(hours, minutes, 0, 0);
      
      // Check collision
      const targetExisting = scheduleGrid[employeeId]?.[time];
      if (targetExisting && targetExisting.id !== draggedAppointment && targetExisting.status !== 'CANCELLED') {
        alert('Este especialista ya tiene una cita agendada en este horario. Por favor, selecciona otro horario libre.');
        setDraggedAppointment(null);
        return;
      }

      try {
        await onReschedule(draggedAppointment, employeeId, newTime);
      } catch (error) {
        alert('Error al reprogramar la cita. Por favor, inténtalo nuevamente.');
      } finally {
        setDraggedAppointment(null);
      }
    }
  };

  // Render a specific unit's schedule
  const renderUnitSchedule = (unitType: 'SPA' | 'BARBERIA', unitEmployees: Employee[]) => {
    const isSpa = unitType === 'SPA';

    return (
      <div className="mb-8 last:mb-0">
        {/* Unit Header Card */}
        <div className="flex items-center justify-between p-4 mb-4 rounded-unit border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)]">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-unit font-bold shadow-unit-sm",
              isSpa 
                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20" 
                : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
            )}>
              {isSpa ? <Sparkles className="h-4 w-4" /> : <Scissors className="h-4 w-4" />}
            </div>
            <div>
              <h4 className="text-base font-bold text-[var(--unit-text)]">{isSpa ? 'Área SPA & Estética' : 'Área Barbería'}</h4>
              <p className="text-xs text-[var(--unit-text-muted)] font-medium">
                {unitEmployees.length} {unitEmployees.length === 1 ? 'especialista disponible' : 'especialistas disponibles'}
              </p>
            </div>
          </div>
          <span className={cn(
            "text-xs font-semibold px-3 py-1 rounded-full border",
            isSpa 
              ? "bg-purple-500/10 text-purple-600 border-purple-500/20" 
              : "bg-blue-500/10 text-blue-600 border-blue-500/20"
          )}>
            {isSpa ? 'SPA' : 'Barbería'}
          </span>
        </div>

        {unitEmployees.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-[var(--unit-border)]/50 rounded-unit">
            <p className="text-xs text-[var(--unit-text-muted)]">No hay especialistas asignados a esta unidad.</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[700px]">
              {/* Employee Column Headers */}
              <div 
                className="grid gap-3 mb-3 sticky top-0 z-20 bg-[var(--unit-surface)] py-2 border-b border-[var(--unit-border)]/40"
                style={{
                  gridTemplateColumns: `80px repeat(${unitEmployees.length}, minmax(180px, 1fr))`
                }}
              >
                <div className="flex items-center justify-center text-xs font-bold text-[var(--unit-text-muted)] uppercase tracking-wider bg-[var(--unit-surface-elevated)] rounded-unit border border-[var(--unit-border)]/40 py-2">
                  Hora
                </div>
                {unitEmployees.map(emp => (
                  <div 
                    key={emp.id} 
                    className="flex items-center gap-2.5 p-2 rounded-unit bg-[var(--unit-surface-elevated)] border border-[var(--unit-border)]/40 shadow-unit-sm"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-unit flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-unit-sm",
                      isSpa ? "bg-purple-600" : "bg-blue-600"
                    )}>
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--unit-text)] truncate">{emp.name}</p>
                      <p className="text-[10px] text-[var(--unit-text-muted)]">Especialista</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Time Slot Rows */}
              <div className="space-y-2">
                {TIME_SLOTS.map((time) => (
                  <div 
                    key={time}
                    className="grid gap-3 items-stretch min-h-[56px]"
                    style={{
                      gridTemplateColumns: `80px repeat(${unitEmployees.length}, minmax(180px, 1fr))`
                    }}
                  >
                    {/* Time Label */}
                    <div className="flex items-center justify-center text-xs font-bold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)]/60 rounded-unit border border-[var(--unit-border)]/30">
                      {time}
                    </div>

                    {/* Employee Cells */}
                    {unitEmployees.map((emp) => {
                      const appointment = scheduleGrid[emp.id]?.[time];
                      const isHovered = dragOverSlot?.employeeId === emp.id && dragOverSlot?.time === time;

                      if (appointment) {
                        const durationMin = getAppointmentDurationMinutes(appointment);
                        const styleConfig = statusCardStyles[appointment.status] || statusCardStyles.SCHEDULED;
                        const serviceName = appointment.items?.[0]?.service?.name || (appointment as any).service?.name || 'Servicio';
                        const customerName = appointment.customer?.name || 'Cliente';

                        return (
                          <div
                            key={`${emp.id}-${time}`}
                            draggable
                            onDragStart={() => handleDragStart(appointment.id)}
                            onClick={() => onViewAppointment(appointment.id)}
                            className={cn(
                              "relative p-2.5 rounded-unit border-2 cursor-pointer transition-all duration-150 shadow-unit-sm hover:shadow-unit hover:scale-[1.01] flex flex-col justify-between select-none group",
                              styleConfig.bg,
                              styleConfig.border,
                              draggedAppointment === appointment.id && "opacity-40 ring-2 ring-[var(--unit-accent)]"
                            )}
                            title={`Cita de ${customerName} (${durationMin} min) - Clic para ver detalles o arrastra para mover`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-md", styleConfig.badgeBg, styleConfig.badgeText)}>
                                  {format(new Date(appointment.startTime), 'HH:mm')}
                                </span>
                                <span className="text-[10px] font-semibold text-[var(--unit-text-muted)]">
                                  {durationMin} min
                                </span>
                              </div>
                              <p className={cn("text-xs font-bold truncate leading-tight", styleConfig.text)}>
                                {customerName}
                              </p>
                              <p className="text-[11px] text-[var(--unit-text-muted)] truncate mt-0.5 font-medium">
                                {serviceName}
                              </p>
                            </div>
                            
                            {appointment.sale && (
                              <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                <CheckCircle className="h-3 w-3" />
                                <span>Cobrado</span>
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={`${emp.id}-${time}`}
                          className={cn(
                            "min-h-[56px] border border-dashed border-[var(--unit-border)]/40 rounded-unit hover:border-[var(--unit-accent)]/60 hover:bg-[var(--unit-accent)]/5 cursor-pointer transition-all flex items-center justify-center group",
                            isHovered && "bg-[var(--unit-accent)]/15 border-[var(--unit-accent)] border-solid scale-[1.01]"
                          )}
                          onClick={() => handleTimeSlotClick(emp.id, time, unitType)}
                          onDragOver={(e) => handleDragOver(e, emp.id, time)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, emp.id, time)}
                          title={`Agendar con ${emp.name} a las ${time}`}
                        >
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs font-semibold text-[var(--unit-accent)]">
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">Agendar</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Schedule Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-unit-lg border border-[var(--unit-border)]/50 bg-[var(--unit-surface-elevated)] shadow-unit-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevDay}
            className="flex h-9 w-9 items-center justify-center rounded-unit bg-[var(--unit-surface)] border border-[var(--unit-border)]/50 hover:bg-[var(--unit-accent)]/10 hover:border-[var(--unit-accent)]/30 text-[var(--unit-text)] transition-all"
            title="Día anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-bold text-[var(--unit-text)] capitalize">
              {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
            </h3>
            <p className="text-xs text-[var(--unit-text-muted)] font-medium">
              {dayAppointments.length} {dayAppointments.length === 1 ? 'cita programada' : 'citas programadas'} para este día
            </p>
          </div>

          <button
            onClick={handleNextDay}
            className="flex h-9 w-9 items-center justify-center rounded-unit bg-[var(--unit-surface)] border border-[var(--unit-border)]/50 hover:bg-[var(--unit-accent)]/10 hover:border-[var(--unit-accent)]/30 text-[var(--unit-text)] transition-all"
            title="Día siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {!isToday(selectedDate) && (
            <button
              onClick={handleToday}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-unit bg-[var(--unit-accent)] text-white text-xs font-bold hover:bg-[var(--unit-accent)]/90 transition-all shadow-unit-sm active:scale-[0.98]"
            >
              <Calendar className="h-3.5 w-3.5" />
              Ir a Hoy
            </button>
          )}

          {/* Quick status summary helper */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-[var(--unit-text-muted)] pl-3 border-l border-[var(--unit-border)]/40">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500" /> Programada
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> En curso
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Completada
            </span>
          </div>
        </div>
      </div>

      {/* Renders Selected Unit or All Units */}
      {(selectedUnit === 'SPA' || selectedUnit === null) && renderUnitSchedule('SPA', employeesByUnit.SPA)}
      {(selectedUnit === 'BARBERIA' || selectedUnit === null) && renderUnitSchedule('BARBERIA', employeesByUnit.BARBERIA)}
    </div>
  );
}
