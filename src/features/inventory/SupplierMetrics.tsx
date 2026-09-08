import { Building2, Package as PackageIcon, Phone, CheckCircle, TrendingUp, Mail, MapPin, Award } from 'lucide-react';
import { KPICard } from '@/components/ui/KPICard';

export interface Supplier {
  id: string;
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: {
    stockEntries: number;
  };
}

interface SupplierMetricsProps {
  suppliers: Supplier[];
}

export function SupplierMetrics({ suppliers }: SupplierMetricsProps) {
  const total = suppliers.length;
  const active = suppliers.filter(s => s.isActive).length;
  const withPhone = suppliers.filter(s => !!s.phone).length;
  const withEmail = suppliers.filter(s => !!s.email).length;
  const withAddress = suppliers.filter(s => !!s.address).length;
  const totalDeliveries = suppliers.reduce((sum, s) => sum + (s._count?.stockEntries || 0), 0);
  const topSupplier = suppliers.length > 0 
    ? suppliers.reduce((max, s) => (s._count?.stockEntries || 0) > (max._count?.stockEntries || 0) ? s : max, suppliers[0]) 
    : null;
  const recentSuppliers = suppliers.filter(s => {
    const createdDate = new Date(s.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return createdDate > thirtyDaysAgo;
  }).length;

  return (
    <div className="space-y-4 mb-6">
      {/* First Row - 4 Primary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Proveedores"
          value={total}
          subtitle={`${active} activos`}
          icon={<Building2 className="h-5 w-5" />}
          color="blue"
        />
        <KPICard
          title="Proveedores Activos"
          value={active}
          subtitle={`${total > 0 ? ((active / total) * 100).toFixed(0) : 0}% del total`}
          icon={<CheckCircle className="h-5 w-5" />}
          color="green"
        />
        <KPICard
          title="Entradas de Stock"
          value={totalDeliveries}
          subtitle="Total de recepciones"
          icon={<PackageIcon className="h-5 w-5" />}
          color="purple"
        />
        <KPICard
          title="Nuevos (30 días)"
          value={recentSuppliers}
          subtitle="Proveedores recientes"
          icon={<TrendingUp className="h-5 w-5" />}
          color="amber"
        />
      </div>

      {/* Second Row - Contact Info & Top Supplier */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Con Teléfono"
          value={withPhone}
          subtitle={`${total > 0 ? ((withPhone / total) * 100).toFixed(0) : 0}% con teléfono`}
          icon={<Phone className="h-5 w-5" />}
          color="teal"
        />
        <KPICard
          title="Con Email"
          value={withEmail}
          subtitle={`${total > 0 ? ((withEmail / total) * 100).toFixed(0) : 0}% con email`}
          icon={<Mail className="h-5 w-5" />}
          color="indigo"
        />
        <KPICard
          title="Con Dirección"
          value={withAddress}
          subtitle={`${total > 0 ? ((withAddress / total) * 100).toFixed(0) : 0}% con dirección`}
          icon={<MapPin className="h-5 w-5" />}
          color="pink"
        />
        <KPICard
          title="Principal Proveedor"
          value={topSupplier?.name || 'N/A'}
          subtitle={topSupplier ? `${topSupplier._count?.stockEntries || 0} entradas registradas` : 'Sin datos'}
          icon={<Award className="h-5 w-5" />}
          color="primary"
        />
      </div>
    </div>
  );
}
