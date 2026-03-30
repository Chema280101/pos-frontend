'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useUnitStore } from '@/store/unitStore';
import { format, startOfDay, endOfDay, subDays, isToday, isThisWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, DollarSign, Users, Clock, CheckCircle, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import { KPICard, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { api } from '@/lib/api';

interface SpecialistAppointment {
  id: string;
  clientName: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  status: string;
  unit: string;
}

interface SpecialistCommission {
  id: string;
  saleId: string;
  amount: number;
  status: string;
  createdAt: string;
  serviceName: string;
}

export function DashboardSpecialist(): JSX.Element {
  const user = useAuthStore((s) => s.user);
  const activeUnit = useUnitStore((s) => s.activeUnit);

  // Obtener citas del especialista
  const { data: appointments, isLoading: loadingAppointments } = useQuery({
    queryKey: ['specialist-appointments', user?.id, activeUnit],
    queryFn: async (): Promise<SpecialistAppointment[]> => {
      if (!user?.id || !activeUnit) return [];
      const { data } = await api.get(`/api/appointments?employeeId=${user.id}&unit=${activeUnit}&limit=20`);
      return data?.data || [];
    },
    enabled: !!user?.id && !!activeUnit,
  });

  // Obtener comisiones del especialista
  const { data: commissions, isLoading: loadingCommissions } = useQuery({
    queryKey: ['specialist-commissions', user?.id],
    queryFn: async (): Promise<SpecialistCommission[]> => {
      if (!user?.id) return [];
      const { data } = await api.get(`/api/commissions?userId=${user.id}&limit=50`);
      return data?.data || [];
    },
    enabled: !!user?.id,
  });

  // Calcular métricas
  const todayAppointments = appointments?.filter(apt => 
    isToday(new Date(apt.startTime))
  ).length || 0;

  const thisWeekAppointments = appointments?.filter(apt => 
    isThisWeek(new Date(apt.startTime), { weekStartsOn: 1 })
  ).length || 0;

  const completedAppointments = appointments?.filter(apt => 
    apt.status === 'COMPLETED'
  ).length || 0;

  const pendingCommissions = commissions?.filter(comp => 
    comp.status === 'PENDING'
  ).reduce((sum, comp) => sum + comp.amount, 0) || 0;

  const paidCommissions = commissions?.filter(comp => 
    comp.status === 'PAID'
  ).reduce((sum, comp) => sum + comp.amount, 0) || 0;

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  const userName = user?.name?.split(' ')[0] || 'Usuario';

  return (
    <div className="relative min-h-screen bg-[var(--unit-surface)] overflow-hidden">
      {/* Header */}
      <div className="relative z-10 max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="bg-gradient-to-r from-[var(--unit-primary)]/5 to-[var(--unit-accent)]/5 rounded-[var(--unit-border-radius)] p-6 border border-[var(--unit-border)]/20">
            <h1 className="text-3xl font-bold text-[var(--unit-text)] mb-2">
              {greeting}, <span className="text-[var(--unit-accent)]">{userName}</span>
            </h1>
            <p className="text-[var(--unit-text-muted)] text-sm font-medium uppercase tracking-wider">
              Especialista SPA · {activeUnit || 'Sin unidad asignada'}
            </p>
          </div>
          
          <div className="hidden lg:flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-[var(--unit-text-muted)] uppercase tracking-wider">Unidad activa</p>
              <p className="text-lg font-bold text-[var(--unit-text)]">{activeUnit || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* KPI Cards - Solo información no financiera */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Tratamientos de Hoy */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-purple-200/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <KPICard
              title="Tratamientos Hoy"
              value={todayAppointments}
              subtitle="Agendados para hoy"
              description="Mis tratamientos programados"
              href="/appointments"
              color="purple"
              icon={<Sparkles className="h-6 w-6 text-white" />}
            />
          </div>

          {/* Tratamientos Semana */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-100/50 to-teal-200/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <KPICard
              title="Tratamientos Semana"
              value={thisWeekAppointments}
              subtitle="Esta semana"
              description="Total de tratamientos"
              href="/appointments"
              color="primary"
              icon={<Calendar className="h-6 w-6 text-white" />}
            />
          </div>

          {/* Servicios Completados */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-green-200/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <KPICard
              title="Servicios Hechos"
              value={completedAppointments}
              subtitle="Tratamientos completados"
              description="Total realizados"
              href="/appointments"
              color="green"
              icon={<CheckCircle className="h-6 w-6 text-white" />}
            />
          </div>

          {/* Comisiones Pendientes (sin mostrar valor monetario) */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-100/50 to-amber-200/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <KPICard
              title="Comisiones"
              value={commissions?.filter(c => c.status === 'PENDING').length || 0}
              subtitle="Pendientes de cobro"
              description="Ver detalles"
              href="/commissions"
              color="amber"
              icon={<TrendingUp className="h-6 w-6 text-white" />}
            />
          </div>
        </div>

        {/* Próximos Tratamientos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6">
            <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Próximos Tratamientos</h3>
                  <p className="text-sm text-[var(--unit-text-muted)]">Mis tratamientos agendados</p>
                </div>
              </div>
            </div>

            {loadingAppointments ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {appointments?.slice(0, 5).map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 bg-[var(--unit-surface)]/50 rounded-lg border border-[var(--unit-border)]/30">
                    <div className="flex-1">
                      <p className="font-medium text-[var(--unit-text)]">{appointment.clientName}</p>
                      <p className="text-sm text-[var(--unit-text-muted)]">{appointment.serviceName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-[var(--unit-text)]">
                        {format(new Date(appointment.startTime), 'HH:mm', { locale: es })}
                      </p>
                      <p className="text-xs text-[var(--unit-text-muted)] capitalize">
                        {appointment.status === 'SCHEDULED' ? 'Programada' : appointment.status}
                      </p>
                    </div>
                  </div>
                ))}
                {(!appointments || appointments.length === 0) && (
                  <div className="text-center py-8">
                    <Sparkles className="h-12 w-12 text-[var(--unit-text-muted)] mx-auto mb-3" />
                    <p className="text-[var(--unit-text-muted)]">No tienes tratamientos agendados</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comisiones Recientes */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6">
            <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Mis Comisiones</h3>
                  <p className="text-sm text-[var(--unit-text-muted)]">Estado de mis comisiones</p>
                </div>
              </div>
            </div>

            {loadingCommissions ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-12 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {commissions?.slice(0, 5).map((commission) => (
                  <div key={commission.id} className="flex items-center justify-between p-3 bg-[var(--unit-surface)]/50 rounded-lg border border-[var(--unit-border)]/30">
                    <div className="flex-1">
                      <p className="font-medium text-[var(--unit-text)]">{commission.serviceName}</p>
                      <p className="text-sm text-[var(--unit-text-muted)]">
                        {format(new Date(commission.createdAt), 'dd MMM', { locale: es })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        commission.status === 'PAID' 
                          ? 'bg-green-100 text-green-800'
                          : commission.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-800'
                      )}>
                        {commission.status === 'PAID' ? 'Pagada' : 
                         commission.status === 'PENDING' ? 'Pendiente' : commission.status}
                      </span>
                    </div>
                  </div>
                ))}
                {(!commissions || commissions.length === 0) && (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-[var(--unit-text-muted)] mx-auto mb-3" />
                    <p className="text-[var(--unit-text-muted)]">No tienes comisiones registradas</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/appointments"
            className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-purple-50 to-purple-100 p-6 hover:shadow-lg transition-all duration-300 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-purple-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
            <div className="relative flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-purple-900">Ver Tratamientos</h3>
                <p className="text-sm text-purple-700">Gestionar mi agenda</p>
              </div>
            </div>
          </Link>

          <Link
            href="/commissions"
            className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-amber-50 to-amber-100 p-6 hover:shadow-lg transition-all duration-300 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-100/50 to-amber-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
            <div className="relative flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 shadow-lg group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-900">Mis Comisiones</h3>
                <p className="text-sm text-amber-700">Ver mis ganancias</p>
              </div>
            </div>
          </Link>

          <Link
            href="/profile"
            className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-teal-50 to-teal-100 p-6 hover:shadow-lg transition-all duration-300 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-teal-100/50 to-teal-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
            <div className="relative flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 shadow-lg group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-teal-900">Mi Perfil</h3>
                <p className="text-sm text-teal-700">Gestionar datos</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
