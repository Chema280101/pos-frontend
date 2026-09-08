import { Activity, CheckCircle, DollarSign, TrendingUp, Star, Timer, Package, Award } from 'lucide-react';
import type { Service } from '@/types/service';
import { KPICard } from '@/components/ui/KPICard';

interface ServicesMetricsProps {
  services: Service[];
}

export function ServicesMetrics({ services }: ServicesMetricsProps) {
  const total = services.length;
  const active = services.filter(s => s.isActive).length;
  const avgPrice = services.length > 0 ? services.reduce((sum, s) => sum + s.price, 0) / services.length : 0;
  const avgDuration = services.length > 0 ? services.reduce((sum, s) => sum + s.durationMin, 0) / services.length : 0;
  const totalRevenue = services.reduce((sum, s) => sum + (s.price * s.timesVended), 0);
  const mostPopular = services.length > 0 ? services.reduce((max, s) => s.timesVended > (max?.timesVended || 0) ? s : max, services[0]) : null;
  const comboEligible = services.filter(s => s.isComboEligible).length;
  const topPerformers = services.filter(s => s.timesVended > 10).length;

  return (
    <div className="space-y-4 mb-6">
      {/* First Row - 4 Core Services Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Servicios"
          value={total}
          description="Catálogo registrado"
          color="blue"
          icon={<Activity className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Servicios Activos"
          value={active}
          description="Disponibles para venta"
          color="green"
          icon={<CheckCircle className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Precio Promedio"
          value={avgPrice.toFixed(2)}
          unit="S/"
          description="Tarifa media del catálogo"
          color="purple"
          icon={<DollarSign className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Ingresos Totales"
          value={totalRevenue.toFixed(2)}
          unit="S/"
          description="Histórico generado"
          color="amber"
          icon={<TrendingUp className="h-6 w-6 text-white" />}
        />
      </div>

      {/* Second Row - 4 Additional Services Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Más Popular"
          value={mostPopular ? mostPopular.name : 'N/A'}
          subtitle={mostPopular ? `${mostPopular.timesVended} ventas` : 'Sin datos'}
          description="Servicio con mayor demanda"
          color="pink"
          icon={<Star className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Duración Media"
          value={`${Math.round(avgDuration || 0)} min`}
          description="Tiempo promedio por atención"
          color="indigo"
          icon={<Timer className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Para Combos"
          value={comboEligible}
          description="Aptos para paquetes"
          color="teal"
          icon={<Package className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Destacados (10+)"
          value={topPerformers}
          description="Servicios de alto volumen"
          color="green"
          icon={<Award className="h-6 w-6 text-white" />}
        />
      </div>
    </div>
  );
}
