'use client';

import { useCallback, useRef, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import type { DatesSetArg, EventClickArg, EventDropArg, DateSelectArg, ViewApi } from '@fullcalendar/core';

export interface CalendarAppointment {
  id: string;
  unit: string;
  status: string;
  startTime: string;
  endTime: string;
  customer: { id: string; name: string; phone: string };
  items: Array<{
    service: { name: string; durationMin: number };
    employee: { name: string };
  }>;
}

export type CalendarView = 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth';

export interface AppointmentCalendarProps {
  appointments: CalendarAppointment[];
  initialView?: CalendarView;
  initialDate?: string;
  onSelectSlot?: (start: Date, end: Date) => void;
  onSelectAppointment?: (id: string) => void;
  onDatesSet?: (start: Date, end: Date) => void;
  onViewChange?: (view: CalendarView) => void;
  /** Si se proporciona, se habilita drag & drop. Al soltar se llama con (id, start, end). Si la promesa hace reject se revierte el cambio. */
  onEventDrop?: (id: string, start: Date, end: Date) => Promise<void>;
}

function eventTitle(apt: CalendarAppointment): string {
  const services = apt.items.map((i) => `${i.service.name} (${i.employee.name})`).join(' · ');
  return `${apt.customer.name} · ${services}`;
}

function eventClassNames(apt: CalendarAppointment): string[] {
  const classes = ['fc-event-unit'];
  if (apt.unit === 'SPA') classes.push('fc-event-spa');
  if (apt.unit === 'BARBERIA') classes.push('fc-event-barberia');
  if (apt.status === 'CONFIRMED') classes.push('fc-event-confirmed');
  if (apt.status === 'COMPLETED') classes.push('fc-event-completed');
  if (apt.status === 'CANCELLED' || apt.status === 'NO_SHOW') classes.push('fc-event-cancelled');
  if (apt.status === 'IN_PROGRESS') classes.push('fc-event-progress');
  if (apt.status === 'RESCHEDULED') classes.push('fc-event-rescheduled');
  return classes;
}

export function AppointmentCalendar({
  appointments,
  initialView = 'timeGridDay',
  initialDate,
  onSelectSlot,
  onSelectAppointment,
  onDatesSet,
  onViewChange,
  onEventDrop,
}: AppointmentCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);

  // ✅ OPTIMIZACIÓN: Memoizar eventos para evitar re-renders innecesarios
  const events = useMemo(() => {
    return appointments.map((apt) => ({
    id: apt.id,
    title: eventTitle(apt),
    start: apt.startTime,
    end: apt.endTime,
      extendedProps: {
        unit: apt.unit,
        status: apt.status,
        customer: apt.customer,
        items: apt.items,
      },
    classNames: eventClassNames(apt),
    }));
  }, [appointments]);

  // ✅ OPTIMIZACIÓN: Memoizar callbacks para evitar re-renders
  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    onDatesSet?.(arg.view.currentStart, arg.view.currentEnd);
  }, [onDatesSet]);

  const handleEventClick = useCallback((arg: EventClickArg) => {
      onSelectAppointment?.(arg.event.id);
  }, [onSelectAppointment]);

  const handleSelect = useCallback((arg: DateSelectArg) => {
    onSelectSlot?.(arg.start, arg.end);
  }, [onSelectSlot]);

  const handleEventDrop = useCallback(async (arg: EventDropArg) => {
    if (!onEventDrop) return false;
    
    try {
      await onEventDrop(arg.event.id, arg.event.start!, arg.event.end!);
      return true;
    } catch {
      return false; // Revert change
    }
  }, [onEventDrop]);

  const handleViewChange = useCallback(() => {
    const api = calendarRef.current?.getApi();
    if (api && onViewChange) {
      onViewChange(api.view.type as CalendarView);
    }
  }, [onViewChange]);

  // ✅ OPTIMIZACIÓN: Configuración optimizada del calendario
  const calendarConfig = useMemo(() => ({
    plugins: [timeGridPlugin, dayGridPlugin, interactionPlugin],
    initialView,
    initialDate,
    events,
    locale: esLocale,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridDay,timeGridWeek,dayGridMonth',
    },
    height: 'auto',
    slotMinTime: '06:00:00',  // ✅ 6 AM para permitir citas tempranas
    slotMaxTime: '02:00:00',  // ✅ 2 AM del día siguiente para soportar citas que cruzan medianoche
    slotDuration: '00:30:00',
    allDaySlot: false,
    editable: !!onEventDrop,
    droppable: !!onEventDrop,
    selectable: !!onSelectSlot,
    selectMirror: true,
    dayMaxEvents: true,
    eventMaxStack: 3,
    eventLimit: true,
    lazyFetching: true, // ✅ OPTIMIZACIÓN: Lazy loading de eventos
    eventOrder: 'start',
    eventDidMount: () => {
      // ✅ OPTIMIZACIÓN: Callback para cuando los eventos se montan
    },
  }), [initialView, initialDate, events, onEventDrop, onSelectSlot]);

  return (
      <FullCalendar
        ref={calendarRef}
      {...calendarConfig}
        datesSet={handleDatesSet}
      eventClick={handleEventClick}
      select={handleSelect}
      eventDrop={handleEventDrop}
      viewDidMount={handleViewChange}
      />
  );
}

