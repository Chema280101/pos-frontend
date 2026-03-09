'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUnitStore } from '@/store/unitStore';
import { useNotificationStore } from '@/store/notificationStore';
import { type AppointmentForReminder } from '@/types/appointment';

const REMINDER_WINDOW_MIN = 25; // avisar cuando falten entre 25 y 35 min
const REMINDER_WINDOW_MAX = 35;
const POLL_INTERVAL_MS = 2 * 60 * 1000; // cada 2 min
const POLL_INTERVAL_WITH_APPOINTMENTS_MS = 30 * 1000; // cada 30 seg si hay citas próximas

function getMinutesUntil(start: Date): number {
  return (start.getTime() - Date.now()) / (60 * 1000);
}

/**
 * Hace polling a citas en la próxima hora y añade una notificación por cada cita
 * que esté en la ventana "~30 min antes" (entre REMINDER_WINDOW_MIN y REMINDER_WINDOW_MAX).
 * Solo añade una vez por cita (id reminder-{appointmentId}).
 */
export function useAppointmentReminders(enabled: boolean = true): void {
  const activeUnit = useUnitStore((s) => s.activeUnit);
  const unit = activeUnit ?? 'SPA';
  const addedIdsRef = useRef<Set<string>>(new Set());

  // ✅ OPTIMIZACIÓN: Polling inteligente basado en citas próximas
  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments', 'reminders', unit],
    queryFn: async (): Promise<AppointmentForReminder[]> => {
      const from = new Date();
      const to = new Date(Date.now() + 60 * 60 * 1000);
      const params = new URLSearchParams({
        unit,
        from: from.toISOString(),
        to: to.toISOString(),
      });
      const { data } = await api.get<{ data: AppointmentForReminder[] }>(`/api/appointments?${params}`);
      return data.data; // ✅ FIX: Access nested data property
    },
    enabled: enabled, // ✅ Add enabled parameter
    refetchInterval: (query) => {
      // ✅ OPTIMIZACIÓN: Polling más frecuente si hay citas próximas
      const data = query.state.data as AppointmentForReminder[];
      if (!data || !Array.isArray(data) || data.length === 0) return POLL_INTERVAL_MS;
      
      const hasUpcomingAppointments = data.some((apt: AppointmentForReminder) => {
        if (apt.status !== 'SCHEDULED' && apt.status !== 'CONFIRMED') return false;
        const minutesUntil = getMinutesUntil(new Date(apt.startTime));
        return minutesUntil >= REMINDER_WINDOW_MIN && minutesUntil <= REMINDER_WINDOW_MAX;
      });
      
      return hasUpcomingAppointments ? POLL_INTERVAL_WITH_APPOINTMENTS_MS : POLL_INTERVAL_MS;
    },
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    // ✅ SAFETY: Return early if disabled
    if (!enabled) return;
    
    // ✅ SAFETY: Ensure appointments is an array before processing
    if (!Array.isArray(appointments)) return;
    
    for (const apt of appointments as AppointmentForReminder[]) {
      if (apt.status !== 'SCHEDULED' && apt.status !== 'RESCHEDULED') continue;

      const start = new Date(apt.startTime);
      const minUntil = getMinutesUntil(start);
      if (minUntil < REMINDER_WINDOW_MIN || minUntil > REMINDER_WINDOW_MAX) continue;

      const reminderId = `reminder-${apt.id}`;
      if (addedIdsRef.current.has(reminderId)) continue;

      const customerName = apt.customer?.name ?? 'Cliente';
      const serviceNames = apt.items?.map((i) => i.service?.name).filter(Boolean).join(', ') ?? 'Servicio';
      const mins = Math.round(minUntil);

      useNotificationStore.getState().add({
        type: 'appointment',
        title: 'Cita próximamente',
        message: `En ~${mins} min: ${customerName} — ${serviceNames}`,
        link: '/appointments',
        linkLabel: 'Ver agenda',
      });

      addedIdsRef.current.add(reminderId);
    }
  }, [appointments, enabled]);
}
