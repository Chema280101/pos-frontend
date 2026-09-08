import { Package, TrendingUp, AlertTriangle, DollarSign, BarChart3, Users, ShoppingCart, Activity } from 'lucide-react';
import type { Product } from '@/types/product';
import { KPICard } from '@/components/ui/KPICard';

interface InventoryMetricsProps {
  products: Product[];
}

export function InventoryMetrics({ products = [] }: InventoryMetricsProps) {
  const safeProducts = Array.isArray(products) ? products : [];
  const total = safeProducts.length;
  const active = safeProducts.filter(p => p.isActive).length;
  const inactive = safeProducts.filter(p => !p.isActive).length;
  const lowStock = safeProducts.filter(p => (p.stock ?? 0) < (p.minStock ?? 0)).length;
  const totalValue = safeProducts.reduce((sum, p) => sum + (Number(p.costPrice) || 0) * (Number(p.stock) || 0), 0);
  const saleValue = safeProducts.reduce((sum, p) => sum + (Number(p.salePrice) || 0) * (Number(p.stock) || 0), 0);
  const forSale = safeProducts.filter(p => p.type === 'FOR_SALE' || p.type === 'BOTH').length;
  const internalUse = safeProducts.filter(p => p.type === 'INTERNAL_USE' || p.type === 'BOTH').length;

  return (
    <div className="space-y-4 mb-6">
      {/* First Row - 4 Primary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Productos"
          value={total}
          description="Inventario registrado"
          color="blue"
          icon={<Package className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Productos Activos"
          value={active}
          description="Disponibles para uso/venta"
          color="green"
          icon={<TrendingUp className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Stock Bajo"
          value={lowStock}
          description="Por debajo del mínimo"
          color="amber"
          critical={lowStock > 0}
          icon={<AlertTriangle className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Valor Costo"
          value={totalValue.toFixed(0)}
          unit="S/"
          description="Valorización al costo"
          color="purple"
          icon={<DollarSign className="h-6 w-6 text-white" />}
        />
      </div>

      {/* Second Row - 4 Additional Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Valor Venta"
          value={saleValue.toFixed(0)}
          unit="S/"
          description="Proyección en retail"
          color="teal"
          icon={<ShoppingCart className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Para Venta"
          value={forSale}
          description="Productos comerciales"
          color="indigo"
          icon={<BarChart3 className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Uso Interno"
          value={internalUse}
          description="Insumos profesionales"
          color="pink"
          icon={<Users className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Inactivos"
          value={inactive}
          description="Deshabilitados"
          color="red"
          icon={<Activity className="h-6 w-6 text-white" />}
        />
      </div>
    </div>
  );
}
