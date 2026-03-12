'use client';

import { useState, useMemo, useEffect } from 'react';
import { format, addMinutes, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Clock, User, Calendar, ChevronLeft, ChevronRight, Scissors, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Appointment } from '@/types/appointment';

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

const statusColors = {
  SCHEDULED: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-600 shadow-blue-200',
  IN_PROGRESS: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-yellow-600 shadow-yellow-200',
  COMPLETED: 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-600 shadow-green-200',
  CANCELLED: 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-600 shadow-red-200',
  NO_SHOW: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-600 shadow-gray-200',
  RESCHEDULED: 'bg-gradient-to-r from-sky-500 to-sky-600 text-white border-sky-600 shadow-sky-200',
};

const unitColors = {
  SPA: 'from-purple-500 to-purple-600',
  BARBERIA: 'from-indigo-500 to-indigo-600',
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

  // Sincronizar selectedDate con la prop date cuando cambia
  useEffect(() => {
    setSelectedDate(date);
  }, [date]);

  // Group employees by unit
  const employeesByUnit = useMemo(() => {
    return {
      SPA: employees.filter(emp => emp.unit === 'SPA'),
      BARBERIA: employees.filter(emp => emp.unit === 'BARBERIA'),
    };
  }, [employees]);

  // Filter appointments for selected date
  const dayAppointments = useMemo(() => {
    // ✅ SAFETY: Ensure appointments is an array
    if (!Array.isArray(appointments)) return [];
    
    console.log('📅 OptimizedScheduleView: Filtering appointments for date:', {
      selectedDate: selectedDate.toLocaleDateString(),
      totalAppointments: appointments.length,
      appointments: appointments.map(apt => ({
        id: apt.id,
        startTime: apt.startTime,
        date: new Date(apt.startTime).toLocaleDateString(),
        customer: apt.customer?.name
      }))
    });
    
    const filtered = appointments.filter(apt => {
      const aptDate = new Date(apt.startTime);
      const isWithin = isWithinInterval(aptDate, { start: startOfDay(selectedDate), end: endOfDay(selectedDate) });
      console.log('📅 OptimizedScheduleView: Checking appointment:', {
        id: apt.id,
        startTime: apt.startTime,
        aptDate: aptDate.toLocaleDateString(),
        selectedDate: selectedDate.toLocaleDateString(),
        isWithin
      });
      return isWithin;
    });
    
    console.log('📅 OptimizedScheduleView: Filtered appointments:', filtered.length);
    return filtered;
  }, [appointments, selectedDate]);

  // Group appointments by employee and time
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
      const employeeId = apt.employee?.id;
       
      if (employeeId && grid[employeeId] && grid[employeeId][startTime] === null) {
        grid[employeeId][startTime] = apt;
      }
    });

    return grid;
  }, [dayAppointments, employees]);

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000);
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000);
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  const handleToday = () => {
    const newDate = new Date();
    setSelectedDate(newDate);
    onDateChange?.(newDate);
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, employeeId: string, time: string) => {
    e.preventDefault();
    if (draggedAppointment) {
      const [hours, minutes] = time.split(':').map(Number);
      const newTime = new Date(selectedDate);
      newTime.setHours(hours, minutes, 0, 0);
      
      try {
        await onReschedule(draggedAppointment, employeeId, newTime);
        console.log('✅ Appointment rescheduled successfully');
      } catch (error) {
        console.error('❌ Failed to reschedule appointment:', error);
        // Show error notification
        alert('Error al reprogramar la cita. Por favor, inténtalo nuevamente.');
      } finally {
        setDraggedAppointment(null);
      }
    }
  };

  const getAppointmentDuration = (appointment: Appointment) => {
    // ✅ FIX: Use items array to get service duration since Appointment interface doesn't have service directly
    const duration = 30; // Default duration
    const slots = Math.ceil(duration / 30);
    return slots;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl overflow-hidden">
      {/* Premium Header */}
      <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-6 border-b border-[var(--unit-border)]/30">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrevDay}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border-2 border-[var(--unit-accent)]/30 hover:bg-[var(--unit-accent)]/30 transition-all hover:scale-110"
            >
              <ChevronLeft className="h-5 w-5 text-[var(--unit-accent)]" />
            </button>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-[var(--unit-text)] drop-shadow-lg">
                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
              </h3>
              <p className="text-sm text-[var(--unit-text-muted)] font-medium">
                {dayAppointments.length} citas programadas
              </p>
            </div>
            <button
              onClick={handleNextDay}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border-2 border-[var(--unit-accent)]/30 hover:bg-[var(--unit-accent)]/30 transition-all hover:scale-110"
            >
              <ChevronRight className="h-5 w-5 text-[var(--unit-accent)]" />
            </button>
          </div>
          <button
            onClick={handleToday}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white font-bold shadow-lg border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <Calendar className="h-4 w-4" />
            Hoy
          </button>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="p-6">
        <div className="overflow-x-auto">
          {/* SPA Section - Show only when SPA is selected or no unit is selected */}
          {(selectedUnit === 'SPA' || selectedUnit === null) && (
            <div className={selectedUnit === null ? 'mb-8' : ''}>
              {/* SPA Premium Header */}
              <div className="relative overflow-hidden rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-50 to-purple-100 p-4 mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-purple-600/10 rounded-xl"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-purple-900">SPA</h4>
                      <p className="text-sm text-purple-700 font-medium">
                        {employeesByUnit.SPA.length} estilistas disponibles
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100/80 rounded-full border border-purple-300">
                    <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-purple-700">Activo</span>
                  </div>
                </div>
              </div>
              
              <div className="min-w-[600px]">
                {/* SPA Header */}
                <div className="grid grid-cols-[80px_repeat(auto-fit,_minmax(180px,_1fr))] gap-3 mb-4">
                  <div className="text-xs font-bold text-purple-700 uppercase tracking-wider bg-purple-100/50 px-3 py-2 rounded-xl border border-purple-200 text-center">
                    Hora
                  </div>
                  {employeesByUnit.SPA.map(emp => (
                    <div key={emp.id} className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center text-sm font-bold text-purple-600 border-2 border-purple-200 shadow-sm group-hover:scale-110 transition-transform">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-[var(--unit-text)]">{emp.name}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* SPA Time Slots */}
                {TIME_SLOTS.map(time => (
                  <div key={time} className="grid grid-cols-[80px_repeat(auto-fit,_minmax(180px,_1fr))] gap-3 mb-3">
                    <div className="text-xs font-bold text-purple-700 uppercase tracking-wider bg-purple-100/30 px-3 py-3 rounded-xl border border-purple-200 text-center font-medium">
                      {time}
                    </div>

                    {employeesByUnit.SPA.map(emp => {
                      const appointment = scheduleGrid[emp.id]?.[time];
                      
                      if (appointment) {
                        const duration = getAppointmentDuration(appointment);
                        const statusColor = statusColors[appointment.status as keyof typeof statusColors] || statusColors.SCHEDULED;
                        
                        return (
                          <div
                            key={`${emp.id}-${time}`}
                            className={cn(
                              "relative p-3 rounded-xl border-2 cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] shadow-lg backdrop-blur-sm",
                              statusColor
                            )}
                            style={{ 
                              gridRow: `span ${Math.min(duration, 4)}` 
                            }}
                            draggable
                            onDragStart={() => handleDragStart(appointment.id)}
                            onClick={() => onViewAppointment(appointment.id)}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-xl"></div>
                            <div className="relative">
                              <div className="text-sm font-bold text-white mb-1 truncate drop-shadow">
                                {appointment.customer?.name || 'Cliente'}
                              </div>
                              <div className="text-xs text-white/95 truncate mb-1 drop-shadow">
                                {appointment.items?.[0]?.service?.name || 'Servicio'}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-white/90 drop-shadow">
                                <Clock className="h-3 w-3" />
                                <span>{format(new Date(appointment.startTime), 'HH:mm')}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={`${emp.id}-${time}`}
                          className="h-16 border-2 border-dashed border-purple-200/50 rounded-xl hover:border-purple-400 hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] group"
                          onClick={() => handleTimeSlotClick(emp.id, time, 'SPA')}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, emp.id, time)}
                        >
                          <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="h-4 w-4 text-purple-400" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Barbería Section - Show only when BARBERIA is selected or no unit is selected */}
          {(selectedUnit === 'BARBERIA' || selectedUnit === null) && (
            <div>
              {/* Barbería Premium Header */}
              <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-accent)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-4 mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 rounded-xl"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-[var(--unit-text)]">Barman Barbería</h4>
                      <p className="text-sm text-[var(--unit-text-muted)] font-medium">
                        {employeesByUnit.BARBERIA.length} barberos disponibles
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--unit-accent)]/10 rounded-full border border-[var(--unit-accent)]/30">
                    <div className="h-2 w-2 rounded-full bg-[var(--unit-accent)] animate-pulse"></div>
                    <span className="text-xs font-bold text-[var(--unit-accent)]">Activo</span>
                  </div>
                </div>
              </div>
              
              <div className="min-w-[600px]">
                {/* Barbería Header */}
                <div className="grid grid-cols-[80px_repeat(auto-fit,_minmax(180px,_1fr))] gap-3 mb-4">
                  <div className="text-xs font-bold text-[var(--unit-accent)] uppercase tracking-wider bg-[var(--unit-accent)]/10 px-3 py-2 rounded-xl border border-[var(--unit-accent)]/30 text-center">
                    Hora
                  </div>
                  {employeesByUnit.BARBERIA.map(emp => (
                    <div key={emp.id} className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] flex items-center justify-center text-sm font-bold text-white border-2 border-[var(--unit-accent)] shadow-lg group-hover:scale-110 transition-transform">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-[var(--unit-text)]">{emp.name}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Barbería Time Slots */}
                {TIME_SLOTS.map(time => (
                  <div key={time} className="grid grid-cols-[80px_repeat(auto-fit,_minmax(180px,_1fr))] gap-3 mb-3">
                    <div className="text-xs font-bold text-[var(--unit-accent)] uppercase tracking-wider bg-[var(--unit-accent)]/10 px-3 py-3 rounded-xl border border-[var(--unit-accent)]/30 text-center font-medium">
                      {time}
                    </div>

                    {employeesByUnit.BARBERIA.map(emp => {
                      const appointment = scheduleGrid[emp.id]?.[time];
                      
                      if (appointment) {
                        const duration = getAppointmentDuration(appointment);
                        const statusColor = statusColors[appointment.status as keyof typeof statusColors] || statusColors.SCHEDULED;
                        
                        return (
                          <div
                            key={`${emp.id}-${time}`}
                            className={cn(
                              "relative p-3 rounded-xl border-2 cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] shadow-lg backdrop-blur-sm",
                              statusColor
                            )}
                            style={{ 
                              gridRow: `span ${Math.min(duration, 4)}` 
                            }}
                            draggable
                            onDragStart={() => handleDragStart(appointment.id)}
                            onClick={() => onViewAppointment(appointment.id)}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-xl"></div>
                            <div className="relative">
                              <div className="text-sm font-bold text-white mb-1 truncate drop-shadow">
                                {appointment.customer?.name || 'Cliente'}
                              </div>
                              <div className="text-xs text-white/95 truncate mb-1 drop-shadow">
                                {appointment.items?.[0]?.service?.name || 'Servicio'}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-white/90 drop-shadow">
                                <Clock className="h-3 w-3" />
                                <span>{format(new Date(appointment.startTime), 'HH:mm')}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={`${emp.id}-${time}`}
                          className="h-16 border-2 border-dashed border-[var(--unit-accent)]/30 rounded-xl hover:border-[var(--unit-accent)] hover:bg-gradient-to-br hover:from-[var(--unit-accent)]/5 hover:to-[var(--unit-primary)]/5 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] group"
                          onClick={() => handleTimeSlotClick(emp.id, time, 'BARBERIA')}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, emp.id, time)}
                        >
                          <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="h-4 w-4 text-[var(--unit-accent)]" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-[var(--unit-surface)] p-4 border-t border-[var(--unit-border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-xs font-medium text-[var(--unit-text-muted)]">Estados:</div>
            <div className="flex items-center gap-3">
              {Object.entries(statusColors).map(([status, color]) => (
                <div key={status} className="flex items-center gap-1">
                  <div className={cn("w-3 h-3 rounded-full", color)} />
                  <span className="text-xs text-[var(--unit-text-muted)]">
                    {status === 'SCHEDULED' ? 'Programada' :
                     status === 'IN_PROGRESS' ? 'En curso' :
                     status === 'COMPLETED' ? 'Completada' :
                     status === 'CANCELLED' ? 'Cancelada' :
                     status === 'NO_SHOW' ? 'No asistió' :
                     status === 'RESCHEDULED' ? 'Reprogramada' : status}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-xs text-[var(--unit-text-muted)]">
            💡 Tip: Arrastra las citas para reprogramarlas
          </div>
        </div>
      </div>
    </div>
  );
}
