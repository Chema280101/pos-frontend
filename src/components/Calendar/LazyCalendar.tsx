'use client';

import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui';
import type { CalendarAppointment, CalendarView } from './AppointmentCalendar';

// ✅ PERFORMANCE: Lazy loading para FullCalendar - 585KB → 0KB en carga inicial
const AppointmentCalendar = lazy(() => 
  import('./AppointmentCalendar').then(module => ({
    default: module.AppointmentCalendar
  }))
);

interface LazyCalendarProps {
  appointments: CalendarAppointment[];
  initialView?: CalendarView;
  initialDate?: string;
  onSelectSlot?: (start: Date, end: Date) => void;
  onSelectAppointment?: (id: string) => void;
  onDatesSet?: (start: Date, end: Date) => void;
  onViewChange?: (view: CalendarView) => void;
  onEventDrop?: (id: string, start: Date, end: Date) => Promise<void>;
}

export function LazyCalendar(props: LazyCalendarProps): JSX.Element {
  return (
    <Suspense 
      fallback={
        <div className="h-[600px] bg-gray-100 rounded-lg animate-pulse">
          <div className="p-4">
            <div className="h-8 bg-gray-200 rounded mb-4 w-1/4"></div>
            <div className="grid grid-cols-7 gap-2">
              {[...Array(35)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <AppointmentCalendar {...props} />
    </Suspense>
  );
}
