import { Calendar, Clock, CheckCircle, DollarSign, Award, Target, TrendingUp } from 'lucide-react';
import { Appointment } from '@/types/appointment';
import { isToday } from 'date-fns';
import { KPICard } from '@/components/ui/KPICard';

interface AppointmentsMetricsProps {
  appointments: Appointment[];
}

export function AppointmentsMetrics({ appointments }: AppointmentsMetricsProps) {
  const today = new Date();
  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.startTime);
    return isToday(aptDate);
  });

  const completedAppointments = appointments.filter(apt => apt.status === 'COMPLETED');
  const cancelledAppointments = appointments.filter(apt => apt.status === 'CANCELLED' || apt.status === 'NO_SHOW');
  const pendingAppointments = appointments.filter(apt => apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED' || apt.status === 'IN_PROGRESS');

  const completionRate = appointments.length > 0 
    ? (completedAppointments.length / appointments.length) * 100 
    : 0;

  const cancellationRate = appointments.length > 0 
    ? (cancelledAppointments.length / appointments.length) * 100 
    : 0;

  const totalRevenue = completedAppointments.reduce((sum, apt) => {
    const itemsRevenue = apt.items?.reduce((itemSum, item) => 
      itemSum + (item.service?.price || 0), 0) || 0;
    return sum + itemsRevenue;
  }, 0);

  const avgAppointmentValue = completedAppointments.length > 0 
    ? totalRevenue / completedAppointments.length 
    : 0;

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

  const bestUnit = barberiaRevenue >= spaRevenue ? 'BARBERÍA' : 'SPA';

  return (
    <div className="space-y-4 mb-6">
      {/* First Row - 4 Core Appointments Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Citas Totales"
          value={appointments.length}
          description="Citas en el período"
          color="blue"
          icon={<Calendar className="h-5 w-5 text-white" />}
        />
        <KPICard
          title="Citas Hoy"
          value={todayAppointments.length}
          description="Agendadas para la fecha"
          color="green"
          icon={<Clock className="h-5 w-5 text-white" />}
        />
        <KPICard
          title="Tasa de Éxito"
          value={`${Number(completionRate || 0).toFixed(1)}%`}
          description="Citas completadas"
          color="teal"
          icon={<CheckCircle className="h-5 w-5 text-white" />}
        />
        <KPICard
          title="Ingresos por Citas"
          value={totalRevenue.toFixed(2)}
          unit="S/"
          description="Total generado en agenda"
          color="purple"
          icon={<DollarSign className="h-5 w-5 text-white" />}
        />
      </div>

      {/* Second Row - 4 Additional Appointments Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Pendientes"
          value={pendingAppointments.length}
          description="Citas por confirmar / en espera"
          color="amber"
          icon={<Clock className="h-5 w-5 text-white" />}
        />
        <KPICard
          title="Canceladas"
          value={cancelledAppointments.length}
          subtitle={`${Number(cancellationRate || 0).toFixed(1)}%`}
          description="Canceladas / No Show"
          color="red"
          critical={cancelledAppointments.length > 3}
          icon={<Clock className="h-5 w-5 text-white" />}
        />
        <KPICard
          title="Ticket Promedio"
          value={avgAppointmentValue.toFixed(2)}
          unit="S/"
          description="Promedio por cita"
          color="indigo"
          icon={<TrendingUp className="h-5 w-5 text-white" />}
        />
        <KPICard
          title="Unidad Destacada"
          value={bestUnit}
          subtitle={`S/ ${Math.max(barberiaRevenue, spaRevenue).toFixed(2)}`}
          description="Mayor facturación"
          color="pink"
          icon={<Award className="h-5 w-5 text-white" />}
        />
      </div>
    </div>
  );
}
