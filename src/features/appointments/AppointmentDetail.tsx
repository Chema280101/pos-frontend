import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, User, Calendar, CheckCircle, X, AlertCircle, CreditCard, Plus, Scissors } from 'lucide-react';
import { api } from '../../lib/api';

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

export function AppointmentDetail(): JSX.Element {
  const params = useParams();
  const id = params.id == null ? undefined : Array.isArray(params.id) ? params.id[0] : params.id;
  const queryClient = useQueryClient();

  const { data: apt, isLoading } = useQuery({
    queryKey: ['appointment', id],
    queryFn: async (): Promise<Appointment> => {
      const { data } = await api.get<Appointment>(`/api/appointments/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: async (payload: { status: string; cancelReason?: string }) => {
      const { data } = await api.patch(`/api/appointments/${id}/status`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  if (isLoading || !apt) {
    return (
      <div className="min-h-screen bg-[var(--unit-surface)] p-6">
        <p className="text-[var(--unit-text)]">Cargando...</p>
      </div>
    );
  }

  const canChangeStatus = apt.status === 'SCHEDULED' || apt.status === 'IN_PROGRESS';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--unit-surface)] via-[var(--unit-surface-elevated)] to-[var(--unit-surface)] relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="relative max-w-2xl mx-auto p-6">
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-4">
            <div className="h-2 w-2 rounded-full bg-[var(--unit-accent)] animate-pulse"></div>
            <span className="text-sm font-medium text-[var(--unit-text)]">Detalles de Cita</span>
          </div>
          <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">Información de la Cita</h1>
          <p className="text-[var(--unit-text-muted)]">Gestiona los detalles y estado de la cita</p>
        </div>

        {/* Enhanced Back Link */}
        <div className="mb-6">
          <Link
            href="/appointments"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-[var(--unit-border)]/50 text-[var(--unit-accent)] font-medium bg-[var(--unit-surface)] hover:bg-[var(--unit-accent)] hover:text-white transition-all hover:shadow-lg active:scale-[0.98]"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver a Agenda
          </Link>
        </div>

        {/* Premium Detail Container */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6 mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 rounded-2xl"></div>
          
          <div className="relative">
            {/* Customer Info Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--unit-text)]">{apt.customer.name}</h2>
                  <p className="text-[var(--unit-text-muted)]">{apt.customer.phone}</p>
                </div>
              </div>
              
              {/* Status Badge */}
              <span className={`inline-flex items-center px-3 py-1.5 text-sm font-bold rounded-xl border-2 ${
                apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                apt.status === 'CANCELLED' || apt.status === 'NO_SHOW' ? 'bg-red-100 text-red-800 border-red-200' :
                apt.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 border-blue-200' : 
                'bg-gray-100 text-gray-800 border-gray-200'
              }`}>
                {apt.status === 'COMPLETED' ? 'Completada' :
                 apt.status === 'CANCELLED' ? 'Cancelada' :
                 apt.status === 'NO_SHOW' ? 'No asistió' :
                 apt.status === 'IN_PROGRESS' ? 'En curso' : 'Programada'}
              </span>
            </div>

            {/* Appointment Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--unit-surface)]/50 border border-[var(--unit-border)]/30">
                <Calendar className="h-5 w-5 text-[var(--unit-accent)]" />
                <div>
                  <p className="text-[var(--unit-text)] font-medium">
                    {format(new Date(apt.startTime), "EEEE d 'de' MMMM yyyy, HH:mm", { locale: es })} – {format(new Date(apt.endTime), 'HH:mm', { locale: es })}
                  </p>
                  <p className="text-sm text-[var(--unit-text-muted)]">Unidad: {apt.unit}</p>
                </div>
              </div>

              {apt.notes && (
                <div className="p-3 rounded-xl bg-[var(--unit-surface)]/50 border border-[var(--unit-border)]/30">
                  <p className="text-sm text-[var(--unit-text)]">
                    <span className="font-medium">Notas:</span> {apt.notes}
                  </p>
                </div>
              )}

              {apt.cancelReason && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-sm text-red-800">
                    <span className="font-medium">Motivo cancelación:</span> {apt.cancelReason}
                  </p>
                </div>
              )}
            </div>

            {/* Services Section */}
            <div className="mt-6">
              <h3 className="text-lg font-bold text-[var(--unit-text)] mb-4 flex items-center gap-2">
                <Scissors className="h-5 w-5 text-[var(--unit-accent)]" />
                Servicios
              </h3>
              <div className="space-y-3">
                {apt.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--unit-surface)]/50 border border-[var(--unit-border)]/30">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--unit-accent)]/10">
                        <Scissors className="h-4 w-4 text-[var(--unit-accent)]" />
                      </div>
                      <div>
                        <p className="text-[var(--unit-text)] font-medium">{item.service.name}</p>
                        <p className="text-sm text-[var(--unit-text-muted)]">con {item.employee.name}</p>
                      </div>
                    </div>
                    <div className="text-sm text-[var(--unit-text-muted)]">
                      {item.service.durationMin} min
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sale Status Section */}
        {apt.status === 'COMPLETED' && (
          <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6 mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-emerald-600/5 rounded-2xl"></div>
            <div className="relative">
              <h3 className="text-lg font-bold text-[var(--unit-text)] mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                Estado de Venta
              </h3>
              {apt.sale ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 shadow-lg">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-emerald-800 font-bold">Cobrado</p>
                    <p className="text-emerald-600 text-sm">Venta {apt.sale.saleNumber}</p>
                  </div>
                </div>
              ) : (
                <Link
                  href={`/pos?customerId=${encodeURIComponent(apt.customer.id)}&appointmentId=${encodeURIComponent(apt.id)}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg border-2 border-emerald-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  <CreditCard className="h-5 w-5" />
                  Ir a venta
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Status Actions Section */}
        {canChangeStatus && (
          <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 rounded-2xl"></div>
            <div className="relative">
              <h3 className="text-lg font-bold text-[var(--unit-text)] mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-[var(--unit-accent)]" />
                Acciones de Estado
              </h3>
              <div className="flex flex-wrap gap-3">
                {apt.status === 'SCHEDULED' && (
                  <button
                    type="button"
                    onClick={() => statusMutation.mutate({ status: 'IN_PROGRESS' })}
                    disabled={statusMutation.isPending}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-lg border-2 border-blue-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <AlertCircle className="h-4 w-4" />
                    En progreso
                  </button>
                )}
                {(apt.status === 'SCHEDULED' || apt.status === 'IN_PROGRESS') && (
                  <>
                    <button
                      type="button"
                      onClick={() => statusMutation.mutate({ status: 'COMPLETED' })}
                      disabled={statusMutation.isPending}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg border-2 border-emerald-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Completada
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const reason = window.prompt('Motivo de cancelación (obligatorio):');
                        if (reason?.trim()) statusMutation.mutate({ status: 'CANCELLED', cancelReason: reason.trim() });
                      }}
                      disabled={statusMutation.isPending}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold shadow-lg border-2 border-red-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => statusMutation.mutate({ status: 'NO_SHOW' })}
                      disabled={statusMutation.isPending}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-[var(--unit-border)]/50 text-[var(--unit-text)] font-bold bg-[var(--unit-surface)] shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    </div>
  );
}
