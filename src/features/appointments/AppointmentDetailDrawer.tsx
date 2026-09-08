'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle, 
  X, 
  AlertCircle, 
  CreditCard, 
  Eye, 
  Phone, 
  MessageCircle,
  Scissors,
  User,
  Trash2,
  AlertTriangle,
  Play
} from 'lucide-react';
import { api } from '@/lib/api';
import { Drawer } from '@/components/ui';
import { useToastStore } from '@/store/toastStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

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
    service: { name: string; durationMin: number; price?: number };
    employee: { name: string };
  }>;
  sale?: { id: string; saleNumber: string; status: string } | null;
}

const PRESET_CANCEL_REASONS = [
  'Cliente canceló / No puede asistir',
  'Reagendada para otra fecha',
  'Imprevisto / Indisponibilidad del especialista',
  'Duplicada / Error de registro',
  'Cliente no contestó confirmación',
  'Otro motivo'
];

function StatusBadge({ status }: { status: string }): JSX.Element {
  const statusConfig: Record<string, { bg: string; text: string; border: string; label: string; dot: string }> = {
    COMPLETED: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/20',
      label: 'Completada',
      dot: 'bg-emerald-500'
    },
    CONFIRMED: {
      bg: 'bg-teal-500/10',
      text: 'text-teal-600 dark:text-teal-400',
      border: 'border-teal-500/20',
      label: 'Confirmada',
      dot: 'bg-teal-500'
    },
    CANCELLED: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-500/20',
      label: 'Cancelada',
      dot: 'bg-rose-500'
    },
    NO_SHOW: {
      bg: 'bg-slate-500/10',
      text: 'text-[var(--unit-text-muted)] dark:text-slate-400',
      border: 'border-slate-500/20',
      label: 'No asistió',
      dot: 'bg-slate-400'
    },
    IN_PROGRESS: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/20',
      label: 'En curso',
      dot: 'bg-amber-500 animate-pulse'
    },
    SCHEDULED: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-500/20',
      label: 'Programada',
      dot: 'bg-blue-500'
    },
    RESCHEDULED: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-500/20',
      label: 'Reprogramada',
      dot: 'bg-purple-500'
    }
  };

  const config = statusConfig[status] || statusConfig.SCHEDULED;

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border',
      config.bg,
      config.text,
      config.border
    )}>
      <span className={cn('h-2 w-2 rounded-full', config.dot)} />
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
  const addToast = useToastStore((s) => s.addToast);
  const addNotification = useNotificationStore((s) => s.add);

  // State for cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState(PRESET_CANCEL_REASONS[0]);
  const [customReasonNotes, setCustomReasonNotes] = useState('');

  const { data: apt, isLoading } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: async (): Promise<Appointment> => {
      const { data } = await api.get<Appointment>(`/api/appointments/${appointmentId}`);
      return data;
    },
    enabled: !!appointmentId && open,
  });

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
        success(`${customerName} llegó — En atención`);
        addNotification({
          type: 'appointment',
          title: 'Cliente en atención',
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
        success(`Cita de ${customerName} cancelada`);
        addNotification({
          type: 'appointment',
          title: 'Cita cancelada',
          message: `${customerName} — ${serviceNames}. Motivo: ${variables.cancelReason}`,
          link: `/appointments/${data.id}`,
          linkLabel: 'Ver cita',
        });
      } else if (variables.status === 'NO_SHOW' && data) {
        success(`${customerName} marcado como no asistió`);
        addNotification({
          type: 'appointment',
          title: 'Cliente no asistió',
          message: `${customerName} — ${serviceNames}. No se presentó a la cita.`,
          link: `/appointments/${data.id}`,
          linkLabel: 'Ver cita',
        });
      }
      
      setShowCancelModal(false);
      onClose();
    },
    onError: (error: any) => {
      addToast(error?.response?.data?.error || 'Error al actualizar el estado de la cita', 'error', 6000);
    },
  });

  const handleConfirmCancel = () => {
    const finalReason = selectedReason === 'Otro motivo'
      ? (customReasonNotes.trim() || 'Cancelado por el usuario')
      : (customReasonNotes.trim() ? `${selectedReason} - ${customReasonNotes.trim()}` : selectedReason);

    statusMutation.mutate({
      status: 'CANCELLED',
      cancelReason: finalReason
    });
  };

  const getWhatsAppLink = () => {
    if (!apt?.customer?.phone) return null;
    const cleanPhone = apt.customer.phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
    const dateFormatted = format(new Date(apt.startTime), "EEEE d 'de' MMMM", { locale: es });
    const timeFormatted = format(new Date(apt.startTime), 'HH:mm');
    const serviceNames = apt.items.map(i => i.service.name).join(', ');
    const employeeNames = apt.items.map(i => i.employee.name).join(', ');

    const message = `Hola *${apt.customer.name}* 👋 Te escribimos de *Barbería y Spa* para recordarte tu cita:\n\n📅 *Fecha:* ${dateFormatted}\n⏰ *Hora:* ${timeFormatted}\n✂️ *Servicio:* ${serviceNames}\n💈 *Especialista:* ${employeeNames}\n\n¡Te esperamos! Si tienes alguna duda o necesitas reagendar, avísanos con gusto.`;

    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  };

  const canChangeStatus = apt?.status === 'SCHEDULED' || apt?.status === 'CONFIRMED' || apt?.status === 'IN_PROGRESS' || apt?.status === 'RESCHEDULED';
  const canCharge = (apt?.status === 'IN_PROGRESS' || apt?.status === 'COMPLETED') && !apt?.sale;

  return (
    <>
      <Drawer open={open} onClose={onClose} title={apt ? `Cita de ${apt.customer.name}` : 'Detalle de Cita'} width="md">
        {!appointmentId ? null : isLoading || !apt ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--unit-accent)] border-t-transparent"></div>
            <p className="text-xs text-[var(--unit-text-muted)] font-medium">Cargando información de la cita...</p>
          </div>
        ) : (
          <div className="space-y-6 pb-6">
            {/* Header / Customer Card */}
            <div className="rounded-unit-lg border border-[var(--unit-border)]/50 bg-[var(--unit-surface-elevated)] p-5 shadow-unit-sm">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-unit bg-[var(--unit-accent)]/10 border border-[var(--unit-accent)]/20 text-[var(--unit-accent)] font-bold text-base">
                    {apt.customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--unit-text)] leading-tight">{apt.customer.name}</h3>
                    <p className="text-xs text-[var(--unit-text-muted)] font-medium mt-0.5">{apt.customer.phone || 'Sin teléfono'}</p>
                  </div>
                </div>
                <StatusBadge status={apt.status} />
              </div>

              {/* Date, Time and Location */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[var(--unit-border)]/30 text-xs">
                <div className="flex items-center gap-2 text-[var(--unit-text)]">
                  <Calendar className="h-4 w-4 text-[var(--unit-accent)] shrink-0" />
                  <span className="font-medium truncate">
                    {format(new Date(apt.startTime), "dd MMM yyyy", { locale: es })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[var(--unit-text)]">
                  <Clock className="h-4 w-4 text-[var(--unit-accent)] shrink-0" />
                  <span className="font-medium truncate">
                    {format(new Date(apt.startTime), 'HH:mm')} – {format(new Date(apt.endTime), 'HH:mm')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[var(--unit-text)]">
                  <MapPin className="h-4 w-4 text-[var(--unit-accent)] shrink-0" />
                  <span className="font-medium">Unidad: {apt.unit}</span>
                </div>
                {apt.customer.phone && (
                  <a
                    href={getWhatsAppLink() || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>

            {/* Services List */}
            <div className="rounded-unit-lg border border-[var(--unit-border)]/50 bg-[var(--unit-surface-elevated)] p-5 shadow-unit-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-[var(--unit-text-muted)] uppercase tracking-wider">
                  Servicios Solicitados ({apt.items.length})
                </h4>
              </div>
              <div className="space-y-2">
                {apt.items.map((item, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-3 rounded-unit bg-[var(--unit-surface)] border border-[var(--unit-border)]/40 hover:border-[var(--unit-accent)]/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-unit bg-[var(--unit-primary)]/10 text-[var(--unit-primary)]">
                        <Scissors className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--unit-text)]">{item.service.name}</p>
                        <p className="text-xs text-[var(--unit-text-muted)] flex items-center gap-1.5 mt-0.5">
                          <User className="h-3 w-3" /> Especialista: <span className="text-[var(--unit-text)] font-medium">{item.employee.name}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] text-xs font-bold">
                        <Clock className="h-3 w-3" />
                        {item.service.durationMin} min
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes & Cancellation Details */}
            {(apt.notes || apt.cancelReason) && (
              <div className="rounded-unit-lg border border-[var(--unit-border)]/50 bg-[var(--unit-surface-elevated)] p-5 shadow-unit-sm space-y-3">
                <h4 className="text-xs font-bold text-[var(--unit-text-muted)] uppercase tracking-wider">Notas & Observaciones</h4>
                {apt.notes && (
                  <div className="p-3 rounded-unit bg-[var(--unit-surface)] border border-[var(--unit-border)]/40">
                    <p className="text-xs text-[var(--unit-text)] leading-relaxed">{apt.notes}</p>
                  </div>
                )}
                {apt.cancelReason && (
                  <div className="p-3 rounded-unit bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300">
                    <p className="text-xs font-semibold flex items-center gap-1.5 mb-0.5">
                      <AlertCircle className="h-3.5 w-3.5" /> Motivo de cancelación:
                    </p>
                    <p className="text-xs">{apt.cancelReason}</p>
                  </div>
                )}
              </div>
            )}

            {/* Direct POS / Sale Action */}
            <div className="rounded-unit-lg border border-[var(--unit-border)]/50 bg-[var(--unit-surface-elevated)] p-5 shadow-unit-sm">
              <h4 className="text-xs font-bold text-[var(--unit-text-muted)] uppercase tracking-wider mb-3">Cobro y Facturación</h4>
              {apt.sale ? (
                <div className="flex items-center justify-between p-3 rounded-unit bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <div>
                      <p className="text-sm font-bold">Cobrado en Caja</p>
                      <p className="text-xs opacity-90">Comprobante #{apt.sale.saleNumber}</p>
                    </div>
                  </div>
                  <Link
                    href={`/sales?search=${encodeURIComponent(apt.sale.saleNumber)}`}
                    className="px-3 py-1.5 rounded-unit bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors"
                  >
                    Ver Venta
                  </Link>
                </div>
              ) : canCharge ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-unit bg-[var(--unit-accent)]/10 border border-[var(--unit-accent)]/20">
                  <div>
                    <p className="text-sm font-bold text-[var(--unit-text)]">Listo para cobrar</p>
                    <p className="text-xs text-[var(--unit-text-muted)]">Transfiere cliente y servicios directo a Caja/POS</p>
                  </div>
                  <Link
                    href={`/pos?customerId=${encodeURIComponent(apt.customer.id)}&appointmentId=${encodeURIComponent(apt.id)}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-unit bg-[var(--unit-accent)] text-white text-xs font-bold transition-all hover:bg-[var(--unit-accent)]/90 active:scale-[0.98] w-full sm:w-auto shadow-unit"
                    onClick={onClose}
                  >
                    <CreditCard className="h-4 w-4" />
                    Cobrar en POS
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-[var(--unit-text-muted)] italic">
                  El cobro se habilitará cuando la cita esté "En curso" o "Completada".
                </p>
              )}
            </div>

            {/* Quick Status Workflow Actions */}
            {canChangeStatus && (
              <div className="rounded-unit-lg border border-[var(--unit-border)]/50 bg-[var(--unit-surface-elevated)] p-5 shadow-unit-sm">
                <h4 className="text-xs font-bold text-[var(--unit-text-muted)] uppercase tracking-wider mb-3">Acciones de Estado</h4>
                <div className="flex flex-wrap gap-2.5">
                  {/* Step 1: Check in (Scheduled -> In Progress) */}
                  {(apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED' || apt.status === 'RESCHEDULED') && (
                    <button
                      type="button"
                      onClick={() => statusMutation.mutate({ status: 'IN_PROGRESS' })}
                      disabled={statusMutation.isPending}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-unit bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all active:scale-[0.98] shadow-unit-sm disabled:opacity-50"
                    >
                      <Play className="h-3.5 w-3.5 fill-white" />
                      Cliente llegó (Iniciar atención)
                    </button>
                  )}

                  {/* Step 2: Complete Service */}
                  {(apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED' || apt.status === 'IN_PROGRESS' || apt.status === 'RESCHEDULED') && (
                    <button
                      type="button"
                      onClick={() => statusMutation.mutate({ status: 'COMPLETED' })}
                      disabled={statusMutation.isPending}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-unit bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all active:scale-[0.98] shadow-unit-sm disabled:opacity-50"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Marcar Finalizada
                    </button>
                  )}

                  {/* Cancel Action (Opens sleek modal) */}
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    disabled={statusMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-unit border border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancelar Cita
                  </button>

                  {/* No Show Action */}
                  <button
                    type="button"
                    onClick={() => statusMutation.mutate({ status: 'NO_SHOW' })}
                    disabled={statusMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-unit border border-[var(--unit-border)]/50 text-[var(--unit-text-muted)] hover:bg-[var(--unit-surface)] text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    No se presentó
                  </button>
                </div>
              </div>
            )}

            {/* Footer Navigation Link */}
            <div className="pt-2 flex items-center justify-between text-xs text-[var(--unit-text-muted)]">
              <Link
                href={`/appointments/${apt.id}`}
                className="inline-flex items-center gap-1.5 text-[var(--unit-accent)] hover:underline font-semibold"
                onClick={onClose}
              >
                <Eye className="h-4 w-4" />
                Ver detalles completos en página
              </Link>
            </div>
          </div>
        )}
      </Drawer>

      {/* Integrated Cancel Modal */}
      {showCancelModal && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCancelModal(false);
          }}
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-unit-lg border border-[var(--unit-border)]/60 bg-[var(--unit-surface)] p-6 shadow-unit-lg space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-unit bg-rose-500/10 border border-rose-500/20 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--unit-text)]">Cancelar Cita</h3>
                <p className="text-xs text-[var(--unit-text-muted)]">Indica el motivo de la cancelación</p>
              </div>
            </div>

            {/* Preset Options */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">
                Motivo principal
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {PRESET_CANCEL_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedReason(reason)}
                    className={cn(
                      "w-full text-left px-3.5 py-2.5 rounded-unit text-xs font-medium border transition-all flex items-center justify-between",
                      selectedReason === reason
                        ? "bg-[var(--unit-accent)]/10 border-[var(--unit-accent)] text-[var(--unit-accent)] font-semibold shadow-unit-sm"
                        : "bg-[var(--unit-surface-elevated)] border-[var(--unit-border)]/40 text-[var(--unit-text)] hover:bg-[var(--unit-surface)]"
                    )}
                  >
                    <span>{reason}</span>
                    {selectedReason === reason && (
                      <CheckCircle className="h-3.5 w-3.5 text-[var(--unit-accent)] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">
                Notas adicionales (opcional)
              </label>
              <textarea
                value={customReasonNotes}
                onChange={(e) => setCustomReasonNotes(e.target.value)}
                placeholder="Añade algún detalle relevante..."
                rows={2}
                className="w-full rounded-unit border border-[var(--unit-border)]/60 bg-[var(--unit-surface-elevated)] px-3 py-2 text-xs text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/40 placeholder:text-[var(--unit-text-muted)]/50"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-xs font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-colors"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={statusMutation.isPending}
                className="flex-1 px-4 py-2.5 rounded-unit bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all active:scale-[0.98] shadow-unit-sm disabled:opacity-50"
              >
                {statusMutation.isPending ? 'Cancelando...' : 'Confirmar Cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
