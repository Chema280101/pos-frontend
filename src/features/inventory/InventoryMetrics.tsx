import { Package, TrendingUp, AlertTriangle, DollarSign, BarChart3, Users, ShoppingCart, Activity } from 'lucide-react';
import type { Product } from '@/types/product';

interface InventoryMetricsProps {
  products: Product[];
}

export function InventoryMetrics({ products }: InventoryMetricsProps) {
  const total = products.length;
  const active = products.filter(p => p.isActive).length;
  const inactive = products.filter(p => !p.isActive).length;
  const lowStock = products.filter(p => p.stock < p.minStock).length;
  const totalValue = products.reduce((sum, p) => sum + (p.costPrice || 0) * p.stock, 0);
  const saleValue = products.reduce((sum, p) => sum + (p.salePrice || 0) * p.stock, 0);
  const forSale = products.filter(p => p.type === 'FOR_SALE' || p.type === 'BOTH').length;
  const internalUse = products.filter(p => p.type === 'INTERNAL_USE' || p.type === 'BOTH').length;

  return (
    <>
      {/* First Row - 4 Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Products */}
        <div className="relative overflow-hidden rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-50 to-blue-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-blue-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-blue-600 shadow-lg group-hover:scale-110 transition-transform">
                <Package className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-blue-800 bg-white px-3 py-1 rounded-full border border-blue-300 shadow-sm">Total</span>
            </div>
            <p className="text-3xl font-bold text-blue-900 tabular-nums mb-2">{total}</p>
            <p className="text-sm text-blue-700 font-medium">Productos totales</p>
          </div>
        </div>

        {/* Active Products */}
        <div className="relative overflow-hidden rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/50 to-emerald-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 border-2 border-emerald-600 shadow-lg group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-300 shadow-sm">Activos</span>
            </div>
            <p className="text-3xl font-bold text-emerald-900 tabular-nums mb-2">{active}</p>
            <p className="text-sm text-emerald-700 font-medium">Productos activos</p>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="relative overflow-hidden rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-50 to-amber-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-100/50 to-amber-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 border-2 border-amber-600 shadow-lg group-hover:scale-110 transition-transform">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-amber-800 bg-white px-3 py-1 rounded-full border border-amber-300 shadow-sm">Crítico</span>
            </div>
            <p className="text-3xl font-bold text-amber-900 tabular-nums mb-2">{lowStock}</p>
            <p className="text-sm text-amber-700 font-medium">Stock bajo</p>
          </div>
        </div>

        {/* Total Value */}
        <div className="relative overflow-hidden rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-50 to-purple-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-purple-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-purple-600 shadow-lg group-hover:scale-110 transition-transform">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-purple-800 bg-white px-3 py-1 rounded-full border border-purple-300 shadow-sm">Valor</span>
            </div>
            <p className="text-3xl font-bold text-purple-900 tabular-nums mb-2">S/{totalValue.toFixed(0)}</p>
            <p className="text-sm text-purple-700 font-medium">Valor inventario</p>
          </div>
        </div>
      </div>

      {/* Second Row - 4 Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Sale Value */}
        <div className="relative overflow-hidden rounded-xl border-2 border-green-500/30 bg-gradient-to-br from-green-50 to-green-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-green-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 border-2 border-green-600 shadow-lg group-hover:scale-110 transition-transform">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-green-800 bg-white px-3 py-1 rounded-full border border-green-300 shadow-sm">Venta</span>
            </div>
            <p className="text-3xl font-bold text-green-900 tabular-nums mb-2">S/{saleValue.toFixed(0)}</p>
            <p className="text-sm text-green-700 font-medium">Valor venta</p>
          </div>
        </div>

        {/* For Sale */}
        <div className="relative overflow-hidden rounded-xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/50 to-indigo-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 border-2 border-indigo-600 shadow-lg group-hover:scale-110 transition-transform">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-indigo-800 bg-white px-3 py-1 rounded-full border border-indigo-300 shadow-sm">Venta</span>
            </div>
            <p className="text-3xl font-bold text-indigo-900 tabular-nums mb-2">{forSale}</p>
            <p className="text-sm text-indigo-700 font-medium">Para venta</p>
          </div>
        </div>

        {/* Internal Use */}
        <div className="relative overflow-hidden rounded-xl border-2 border-orange-500/30 bg-gradient-to-br from-orange-50 to-orange-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-100/50 to-orange-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 border-2 border-orange-600 shadow-lg group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-orange-800 bg-white px-3 py-1 rounded-full border border-orange-300 shadow-sm">Uso</span>
            </div>
            <p className="text-3xl font-bold text-orange-900 tabular-nums mb-2">{internalUse}</p>
            <p className="text-sm text-orange-700 font-medium">Uso interno</p>
          </div>
        </div>

        {/* Inactive */}
        <div className="relative overflow-hidden rounded-xl border-2 border-gray-500/30 bg-gradient-to-br from-gray-50 to-gray-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100/50 to-gray-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 border-2 border-gray-600 shadow-lg group-hover:scale-110 transition-transform">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-gray-800 bg-white px-3 py-1 rounded-full border border-gray-300 shadow-sm">Inactivo</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 tabular-nums mb-2">{inactive}</p>
            <p className="text-sm text-gray-700 font-medium">Inactivos</p>
          </div>
        </div>
      </div>
    </>
  );
}
