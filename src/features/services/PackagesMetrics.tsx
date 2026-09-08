import { Package as PackageIcon, DollarSign, CheckCircle, Activity, Crown, Timer, Award } from 'lucide-react';
import type { Package } from '@/types/service';
import { KPICard } from '@/components/ui/KPICard';

interface PackagesMetricsProps {
  packages: Package[];
}

export function PackagesMetrics({ packages }: PackagesMetricsProps) {
  const packagesArray = Array.isArray(packages) ? packages : [];
  
  const total = packagesArray.length;
  const active = packagesArray.filter(p => p.status === 'ACTIVE').length;
  const avgPrice = packagesArray.length > 0 ? packagesArray.reduce((sum, p) => sum + p.fixedPrice, 0) / packagesArray.length : 0;
  const avgServices = packagesArray.length > 0 ? packagesArray.reduce((sum, p) => sum + p.services.length, 0) / packagesArray.length : 0;
  const avgDuration = packagesArray.length > 0 ? packagesArray.reduce((sum, p) => sum + p.durationMin, 0) / packagesArray.length : 0;
  const mostValuable = packagesArray.length > 0 ? packagesArray.reduce((max, p) => p.fixedPrice > max.fixedPrice ? p : max, packagesArray[0]) : null;
  const totalServicesInPackages = packagesArray.reduce((sum, p) => sum + p.services.length, 0);
  const complexPackages = packagesArray.filter(p => p.services.length > avgServices * 1.5).length;

  return (
    <div className="space-y-4 mb-6">
      {/* First Row - 4 Core Packages Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Paquetes"
          value={total}
          description="Combos creados"
          color="indigo"
          icon={<PackageIcon className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Paquetes Activos"
          value={active}
          description="Vigentes para venta"
          color="green"
          icon={<CheckCircle className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Precio Promedio"
          value={avgPrice.toFixed(2)}
          unit="S/"
          description="Valor medio de combos"
          color="purple"
          icon={<DollarSign className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Servicios / Pack"
          value={avgServices.toFixed(1)}
          description="Promedio de items incluidos"
          color="amber"
          icon={<Activity className="h-6 w-6 text-white" />}
        />
      </div>

      {/* Second Row - 4 Additional Packages Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Pack Premium"
          value={mostValuable ? mostValuable.name : 'N/A'}
          subtitle={mostValuable ? `S/ ${mostValuable.fixedPrice.toFixed(2)}` : 'Sin datos'}
          description="Mayor valor comercial"
          color="pink"
          icon={<Crown className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Duración Media"
          value={`${Math.round(avgDuration || 0)} min`}
          description="Sesión promedio del combo"
          color="teal"
          icon={<Timer className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Total Servicios"
          value={totalServicesInPackages}
          description="Servicios agrupados"
          color="blue"
          icon={<Activity className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Combos Amplios"
          value={complexPackages}
          description="Con múltiples servicios"
          color="amber"
          icon={<Award className="h-6 w-6 text-white" />}
        />
      </div>
    </div>
  );
}
