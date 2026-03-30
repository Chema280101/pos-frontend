'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, MapPin, Clock, CheckCircle, X, AlertCircle, CreditCard, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { Drawer } from '@/components/ui';
import { useToastStore } from '@/store/toastStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useToast } from '@/hooks/useToast';

export interface AppointmentDetailDrawerProps {
  appointmentId: string | null;
  open: boolean;
  onClose: () => void;
  onInvalidateList?: () => void;
}

interface Appointment {
  id: string;
  unit: string;
  status: string;
  startTime: string;
  endTime: string;
  notes: string | null;
  cancelReason: string | null;
  customer: { id: string; name: string; phone: string };
  items: Array<{
    service: { name: string; durationMin: number };
    employee: { name: string };
  }>;
  sale?: { id: string; saleNumber: string; status: string } | null;
}

function StatusBadge({ status }: { status: string }): JSX.Element {
  const statusConfig = {
    COMPLETED: { 
      bg: 'bg-emerald-100', 
      text: 'text-emerald-800', 
      border: 'border-emerald-200',
      label: 'Completada' 
    },
    CONFIRMED: { 
      bg: 'bg-green-100', 
      text: 'text-green-800', 
      border: 'border-green-200',
      label: 'Confirmada' 
    },
    CANCELLED: { 
      bg: 'bg-red-100', 
      text: 'text-red-800', 
      border: 'border-red-200',
      label: 'Cancelada' 
    },
    NO_SHOW: { 
      bg: 'bg-red-100', 
      text: 'text-red-800', 
      border: 'border-red-200',
      label: 'No asistió' 
    },
    IN_PROGRESS: { 
      bg: 'bg-blue-100', 
      text: 'text-blue-800', 
      border: 'border-blue-200',
      label: 'En curso' 
    },
    SCHEDULED: { 
      bg: 'bg-gray-100', 
      text: 'text-gray-800', 
      border: 'border-gray-200',
      label: 'Programada' 
    },
    RESCHEDULED: { 
      bg: 'bg-amber-100', 
      text: 'text-amber-800', 
      border: 'border-amber-200',
      label: 'Reprogramada' 
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.SCHEDULED;

  return (
    <span className={`inline-flex items-center px-3 py-1.5 text-sm font-bold rounded-xl border-2 ${config.bg} ${config.text} ${config.border} shadow-sm`}>
      {config.label}
    </span>
  );
}

export function AppointmentDetailDrawer({
  appointmentId,
  open,
  onClose,
  onInvalidateList,
}: AppointmentDetailDrawerProps): JSX.Element {
  const queryClient = useQueryClient();
  const { success } = useToast();

  const { data: apt, isLoading } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: async (): Promise<Appointment> => {
      const { data } = await api.get<Appointment>(`/api/appointments/${appointmentId}`);
      return data;
    },
    enabled: !!appointmentId && open,
  });

  const addToast = useToastStore((s) => s.addToast);
  const addNotification = useNotificationStore((s) => s.add);

  const statusMutation = useMutation({
    mutationFn: async (payload: { status: string; cancelReason?: string }) => {
      const { data } = await api.patch(`/api/appointments/${appointmentId}/status`, payload);
      return data;
    },
    onSuccess: (data: Appointment | undefined, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
      queryClient.invalidateQueries({ queryKey: ['appointments-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['appointments-table'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onInvalidateList?.();
      
      const serviceNames = data?.items?.map((i) => i.service.name).join(', ') ?? 'Servicio';
      const customerName = data?.customer?.name ?? 'Cliente';
      
      if (variables.status === 'IN_PROGRESS' && data) {
        success(`${customerName} llegó — ${serviceNames}`);
        addNotification({
          type: 'appointment',
          title: 'Cliente llegó',
          message: `${customerName} — ${serviceNames}. Cita en progreso.`,
          link: `/appointments/${data.id}`,
          linkLabel: 'Ver cita',
        });
      } else if (variables.status === 'COMPLETED' && data) {
        success(`${customerName} — ${serviceNames} completada`);
        addNotification({
          type: 'appointment',
          title: 'Cita completada',
          message: `${customerName} — ${serviceNames}. Servicio finalizado.`,
          link: `/appointments/${data.id}`,
          linkLabel: 'Ver cita',
        });
      } else if (variables.status === 'CANCELLED' && data) {
        success(`${customerName} — ${serviceNames} cancelada`);
        addNotification({
          type: 'appointment',
          title: 'Cita cancelada',
          message: `${customerName} — ${serviceNames}. Motivo: ${variables.cancelReason}`,
          link: `/appointments/${data.id}`,
          linkLabel: 'Ver cita',
        });
      } else if (variables.status === 'NO_SHOW' && data) {
        success(`${customerName} — ${serviceNames} no se presentó`);
        addNotification({
          type: 'appointment',
          title: 'Cliente no se presentó',
          message: `${customerName} — ${serviceNames}. No asistió a la cita.`,
          link: `/appointments/${data.id}`,
          linkLabel: 'Ver cita',
        });
      }
      
      // Cerrar el modal después de cambiar el estado
      onClose();
    },
    onError: (error: any) => {
      addToast('Error al actualizar el estado de la cita', 'error', 6000);
    },
  });

  const canChangeStatus = apt?.status === 'SCHEDULED' || apt?.status === 'CONFIRMED' || apt?.status === 'IN_PROGRESS' || apt?.status === 'RESCHEDULED';

  return (
    <Drawer open={open} onClose={onClose} title={apt ? apt.customer.name : 'Cita'} width="md">
      {!appointmentId ? null : isLoading || !apt ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--unit-accent)]"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Section */}
          <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-4">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 rounded-xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">{apt.customer.name}</h3>
                  <p className="text-sm text-[var(--unit-text-muted)]">{apt.customer.phone}</p>
                </div>
                <StatusBadge status={apt.status} />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-[var(--unit-text)]">
                  <Calendar className="h-4 w-4 text-[var(--unit-accent)]" />
                  {format(new Date(apt.startTime), "dd 'de' MMMM yyyy, HH:mm")} – {' '}
                  {format(new Date(apt.endTime), 'HH:mm')}
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--unit-text)]">
                  <MapPin className="h-4 w-4 text-[var(--unit-accent)]" />
                  Unidad: {apt.unit}
                </div>
              </div>
            </div>
          </div>

          {/* Services Section */}
          <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-4">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 rounded-xl"></div>
            <div className="relative">
              <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider mb-3">Servicios</h4>
              <ul className="space-y-2">
                {apt.items.map((item, i) => (
                  <li key={i} className="flex items-center justify-between p-2 rounded-lg bg-[var(--unit-surface)]/50 border border-[var(--unit-border)]/20">
                    <div>
                      <p className="text-sm font-medium text-[var(--unit-text)]">{item.service.name}</p>
                      <p className="text-xs text-[var(--unit-text-muted)]">con {item.employee.name}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[var(--unit-text-muted)]">
                      <Clock className="h-3 w-3" />
                      {item.service.durationMin} min
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Notes Section */}
          {(apt.notes || apt.cancelReason) && (
            <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-4">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 rounded-xl"></div>
              <div className="relative">
                <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider mb-3">Notas</h4>
                {apt.notes && (
                  <div className="mb-2 p-2 rounded-lg bg-[var(--unit-surface)]/50 border border-[var(--unit-border)]/20">
                    <p className="text-sm text-[var(--unit-text)]">{apt.notes}</p>
                  </div>
                )}
                {apt.cancelReason && (
                  <div className="p-2 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-red-700 font-medium">Motivo cancelación: {apt.cancelReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {canChangeStatus && (
            <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-4">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 rounded-xl"></div>
              <div className="relative">
                <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider mb-3">Acciones</h4>
                <div className="flex flex-wrap gap-3">
                  {(apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED' || apt.status === 'RESCHEDULED') && (
                    <button
                      type="button"
                      onClick={() => statusMutation.mutate({ status: 'IN_PROGRESS' })}
                      disabled={statusMutation.isPending}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-bold shadow-lg border-2 border-amber-600/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Cliente llegó (check-in)
                    </button>
                  )}
                  {(apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED' || apt.status === 'IN_PROGRESS' || apt.status === 'RESCHEDULED') && (
                    <>
                      <button
                        type="button"
                        onClick={() => statusMutation.mutate({ status: 'COMPLETED' })}
                        disabled={statusMutation.isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold shadow-lg border-2 border-emerald-600/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Completada
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const reason = window.prompt('Motivo de cancelación (obligatorio):');
                          if (reason?.trim())
                            statusMutation.mutate({ status: 'CANCELLED', cancelReason: reason.trim() });
                        }}
                        disabled={statusMutation.isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-bold shadow-lg border-2 border-red-600/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => statusMutation.mutate({ status: 'NO_SHOW' })}
                        disabled={statusMutation.isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-slate-500 to-slate-600 text-white text-sm font-bold shadow-lg border-2 border-slate-600/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                      <AlertCircle className="h-4 w-4" />
                      No se presentó
                    </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sale Section */}
          {apt.status === 'COMPLETED' && (
            <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-4">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-emerald-600/5 rounded-xl"></div>
              <div className="relative">
                <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider mb-3">Venta</h4>
                <div className="flex flex-wrap items-center gap-3">
                  {apt.sale ? (
                    <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-100 text-emerald-800 border-2 border-emerald-200 text-sm font-bold">
                      <CheckCircle className="h-4 w-4" />
                      Cobrado · Venta {apt.sale.saleNumber}
                    </span>
                  ) : (
                    <Link
                      href={`/pos?customerId=${encodeURIComponent(apt.customer.id)}&appointmentId=${encodeURIComponent(apt.id)}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold shadow-lg border-2 border-emerald-600/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                      onClick={onClose}
                    >
                      <CreditCard className="h-4 w-4" />
                      Ir a venta
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer Link */}
          <div className="pt-4 border-t border-[var(--unit-border)]/30">
            <Link
              href={`/appointments/${apt.id}`}
              className="inline-flex items-center gap-2 text-sm text-[var(--unit-accent)] hover:text-[var(--unit-primary)] font-medium transition-colors"
              onClick={onClose}
            >
              <Eye className="h-4 w-4" />
              Ver página completa
            </Link>
          </div>
        </div>
      )}
    </Drawer>
  );
}
