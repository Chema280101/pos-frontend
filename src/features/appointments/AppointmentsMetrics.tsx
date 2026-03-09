import { TrendingUp, TrendingDown, Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle, DollarSign, Star, Timer, Activity, UserCheck, UserX, BarChart3, Target } from 'lucide-react';
import { Appointment, AppointmentStatus, BusinessUnit } from '@/types/appointment';
import { format, startOfDay, endOfDay, subDays, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { es } from 'date-fns/locale';

interface AppointmentsMetricsProps {
  appointments: Appointment[];
}

export function AppointmentsMetrics({ appointments }: AppointmentsMetricsProps) {
  // Today's appointments
  const today = new Date();
  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.startTime);
    return isToday(aptDate);
  });

  // This week appointments
  const weekAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.startTime);
    return isThisWeek(aptDate, { weekStartsOn: 1 });
  });

  // This month appointments
  const monthAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.startTime);
    return isThisMonth(aptDate);
  });

  // Status breakdown
  const completedAppointments = appointments.filter(apt => apt.status === 'COMPLETED');
  const cancelledAppointments = appointments.filter(apt => apt.status === 'CANCELLED' || apt.status === 'NO_SHOW');
  const pendingAppointments = appointments.filter(apt => 
    apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED'
  );
  const inProgressAppointments = appointments.filter(apt => apt.status === 'IN_PROGRESS');

  // Unit breakdown
  const barberiaAppointments = appointments.filter(apt => apt.unit === 'BARBERIA');
  const spaAppointments = appointments.filter(apt => apt.unit === 'SPA');

  // Performance metrics
  const completionRate = appointments.length > 0 
    ? (completedAppointments.length / appointments.length) * 100 
    : 0;

  const cancellationRate = appointments.length > 0 
    ? (cancelledAppointments.length / appointments.length) * 100 
    : 0;

  // Revenue from completed appointments
  const totalRevenue = completedAppointments.reduce((sum, apt) => {
    const itemsRevenue = apt.items?.reduce((itemSum, item) => 
      itemSum + (item.service?.price || 0), 0) || 0;
    return sum + itemsRevenue;
  }, 0);

  // Average appointment value
  const avgAppointmentValue = completedAppointments.length > 0 
    ? totalRevenue / completedAppointments.length 
    : 0;

  // Best performing unit
  const barberiaRevenue = completedAppointments
    .filter(apt => apt.unit === 'BARBERIA')
    .reduce((sum, apt) => {
      const itemsRevenue = apt.items?.reduce((itemSum, item) => 
        itemSum + (item.service?.price || 0), 0) || 0;
      return sum + itemsRevenue;
    }, 0);

  const spaRevenue = completedAppointments
    .filter(apt => apt.unit === 'SPA')
    .reduce((sum, apt) => {
      const itemsRevenue = apt.items?.reduce((itemSum, item) => 
        itemSum + (item.service?.price || 0), 0) || 0;
      return sum + itemsRevenue;
    }, 0);

  const bestUnit = barberiaRevenue > spaRevenue ? 'BARBERIA' : 'SPA';
  const bestUnitRevenue = Math.max(barberiaRevenue, spaRevenue);

  return (
    <>
      {/* First Row - 4 Core Appointments Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Appointments */}
        <div className="relative overflow-hidden rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-50 to-blue-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-blue-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-blue-600 shadow-lg group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-blue-800 bg-white px-3 py-1 rounded-full border border-blue-300 shadow-sm">Total</span>
            </div>
            <p className="text-3xl font-bold text-blue-900 tabular-nums mb-2">{appointments.length}</p>
            <p className="text-sm text-blue-700 font-medium">Citas totales</p>
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="relative overflow-hidden rounded-xl border-2 border-green-500/30 bg-gradient-to-br from-green-50 to-green-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-green-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 border-2 border-green-600 shadow-lg group-hover:scale-110 transition-transform">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-green-800 bg-white px-3 py-1 rounded-full border border-green-300 shadow-sm">Hoy</span>
            </div>
            <p className="text-3xl font-bold text-green-900 tabular-nums mb-2">{todayAppointments.length}</p>
            <p className="text-sm text-green-700 font-medium">Citas hoy</p>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="relative overflow-hidden rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/50 to-emerald-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 border-2 border-emerald-600 shadow-lg group-hover:scale-110 transition-transform">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-300 shadow-sm">Éxito</span>
            </div>
            <p className="text-3xl font-bold text-emerald-900 tabular-nums mb-2">{Number(completionRate || 0).toFixed(1)}%</p>
            <p className="text-sm text-emerald-700 font-medium">Tasa de completado</p>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="relative overflow-hidden rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-50 to-purple-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-purple-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-purple-600 shadow-lg group-hover:scale-110 transition-transform">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-purple-800 bg-white px-3 py-1 rounded-full border border-purple-300 shadow-sm">Ingresos</span>
            </div>
            <p className="text-3xl font-bold text-purple-900 tabular-nums mb-2">S/{Number(totalRevenue || 0).toFixed(2)}</p>
            <p className="text-sm text-purple-700 font-medium">Ingresos totales</p>
          </div>
        </div>
      </div>

      {/* Second Row - 4 Additional Appointments Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Pending Appointments */}
        <div className="relative overflow-hidden rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-50 to-amber-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-100/50 to-amber-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 border-2 border-amber-600 shadow-lg group-hover:scale-110 transition-transform">
                <Timer className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-amber-800 bg-white px-3 py-1 rounded-full border border-amber-300 shadow-sm">Pendientes</span>
            </div>
            <p className="text-3xl font-bold text-amber-900 tabular-nums mb-2">{pendingAppointments.length}</p>
            <p className="text-sm text-amber-700 font-medium">Citas pendientes</p>
          </div>
        </div>

        {/* Cancelled Appointments */}
        <div className="relative overflow-hidden rounded-xl border-2 border-red-500/30 bg-gradient-to-br from-red-50 to-red-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-red-100/50 to-red-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 border-2 border-red-600 shadow-lg group-hover:scale-110 transition-transform">
                <XCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-red-800 bg-white px-3 py-1 rounded-full border border-red-300 shadow-sm">Canceladas</span>
            </div>
            <p className="text-3xl font-bold text-red-900 tabular-nums mb-2">{cancelledAppointments.length}</p>
            <p className="text-sm text-red-700 font-medium">Citas canceladas</p>
          </div>
        </div>

        {/* Average Appointment Value */}
        <div className="relative overflow-hidden rounded-xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/50 to-indigo-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 border-2 border-indigo-600 shadow-lg group-hover:scale-110 transition-transform">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-indigo-800 bg-white px-3 py-1 rounded-full border border-indigo-300 shadow-sm">Promedio</span>
            </div>
            <p className="text-3xl font-bold text-indigo-900 tabular-nums mb-2">S/{Number(avgAppointmentValue || 0).toFixed(2)}</p>
            <p className="text-sm text-indigo-700 font-medium">Valor por cita</p>
          </div>
        </div>

        {/* Best Performing Unit */}
        <div className="relative overflow-hidden rounded-xl border-2 border-pink-500/30 bg-gradient-to-br from-pink-50 to-pink-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-100/50 to-pink-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 border-2 border-pink-600 shadow-lg group-hover:scale-110 transition-transform">
                <Star className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-pink-800 bg-white px-3 py-1 rounded-full border border-pink-300 shadow-sm">Mejor</span>
            </div>
            <p className="text-lg font-bold text-pink-900 tabular-nums mb-1 truncate">
              {bestUnit === 'BARBERIA' ? 'Barbería' : 'SPA'}
            </p>
            <p className="text-sm text-pink-700 font-medium">
              S/{Number(bestUnitRevenue || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
