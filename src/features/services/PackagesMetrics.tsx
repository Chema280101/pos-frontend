import { Package as PackageIcon, DollarSign, Clock, TrendingUp, CheckCircle, AlertCircle, Users, Activity, Star, Timer, BarChart3, Target, Zap, Award, Crown } from 'lucide-react';
import type { Package } from '@/types/service';

interface PackagesMetricsProps {
  packages: Package[];
}

export function PackagesMetrics({ packages }: PackagesMetricsProps) {
  // ✅ FIXED: Validar que packages sea un array antes de usar métodos de array
  const packagesArray = Array.isArray(packages) ? packages : [];
  
  const total = packagesArray.length;
  const active = packagesArray.filter(p => p.status === 'ACTIVE').length;
  const inactive = packagesArray.filter(p => p.status === 'INACTIVE').length;
  const avgPrice = packagesArray.length > 0 ? packagesArray.reduce((sum, p) => sum + p.fixedPrice, 0) / packagesArray.length : 0;
  const avgDuration = packagesArray.length > 0 ? packagesArray.reduce((sum, p) => sum + p.durationMin, 0) / packagesArray.length : 0;
  const avgServices = packagesArray.length > 0 ? packagesArray.reduce((sum, p) => sum + p.services.length, 0) / packagesArray.length : 0;
  const mostValuable = packagesArray.length > 0 ? packagesArray.reduce((max, p) => p.fixedPrice > max.fixedPrice ? p : max, packagesArray[0]) : null;
  const withMostServices = packagesArray.length > 0 ? packagesArray.reduce((max, p) => p.services.length > max.services.length ? p : max, packagesArray[0]) : null;

  // Additional metrics
  const premiumPackages = packagesArray.filter(p => p.fixedPrice > avgPrice * 1.5).length;
  const longDurationPackages = packagesArray.filter(p => p.durationMin > avgDuration * 1.5).length;
  const complexPackages = packagesArray.filter(p => p.services.length > avgServices * 1.5).length;
  const totalServicesInPackages = packagesArray.reduce((sum, p) => sum + p.services.length, 0);

  return (
    <>
      {/* First Row - 4 Core Packages Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Packages */}
        <div className="relative overflow-hidden rounded-xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/50 to-indigo-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 border-2 border-indigo-600 shadow-lg group-hover:scale-110 transition-transform">
                <PackageIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-indigo-800 bg-white px-3 py-1 rounded-full border border-indigo-300 shadow-sm">Total</span>
            </div>
            <p className="text-3xl font-bold text-indigo-900 tabular-nums mb-2">{total}</p>
            <p className="text-sm text-indigo-700 font-medium">Paquetes totales</p>
          </div>
        </div>

        {/* Active Packages */}
        <div className="relative overflow-hidden rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/50 to-emerald-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 border-2 border-emerald-600 shadow-lg group-hover:scale-110 transition-transform">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-300 shadow-sm">Activos</span>
            </div>
            <p className="text-3xl font-bold text-emerald-900 tabular-nums mb-2">{active}</p>
            <p className="text-sm text-emerald-700 font-medium">Paquetes activos</p>
          </div>
        </div>

        {/* Average Price */}
        <div className="relative overflow-hidden rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-50 to-purple-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-purple-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-purple-600 shadow-lg group-hover:scale-110 transition-transform">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-purple-800 bg-white px-3 py-1 rounded-full border border-purple-300 shadow-sm">Promedio</span>
            </div>
            <p className="text-3xl font-bold text-purple-900 tabular-nums mb-2">S/{Number(avgPrice || 0).toFixed(2)}</p>
            <p className="text-sm text-purple-700 font-medium">Precio promedio</p>
          </div>
        </div>

        {/* Average Services */}
        <div className="relative overflow-hidden rounded-xl border-2 border-orange-500/30 bg-gradient-to-br from-orange-50 to-orange-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-100/50 to-orange-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 border-2 border-orange-600 shadow-lg group-hover:scale-110 transition-transform">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-orange-800 bg-white px-3 py-1 rounded-full border border-orange-300 shadow-sm">Servicios</span>
            </div>
            <p className="text-3xl font-bold text-orange-900 tabular-nums mb-2">{Number(avgServices || 0).toFixed(1)}</p>
            <p className="text-sm text-orange-700 font-medium">Servicios por paquete</p>
          </div>
        </div>
      </div>

      {/* Second Row - 4 Additional Packages Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Most Valuable Package */}
        <div className="relative overflow-hidden rounded-xl border-2 border-pink-500/30 bg-gradient-to-br from-pink-50 to-pink-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-100/50 to-pink-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 border-2 border-pink-600 shadow-lg group-hover:scale-110 transition-transform">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-pink-800 bg-white px-3 py-1 rounded-full border border-pink-300 shadow-sm">Premium</span>
            </div>
            <p className="text-lg font-bold text-pink-900 tabular-nums mb-1 truncate">
              {mostValuable ? mostValuable.name.slice(0, 15) : 'N/A'}
            </p>
            <p className="text-sm text-pink-700 font-medium">
              S/{mostValuable ? mostValuable.fixedPrice.toFixed(2) : '0.00'}
            </p>
          </div>
        </div>

        {/* Average Duration */}
        <div className="relative overflow-hidden rounded-xl border-2 border-teal-500/30 bg-gradient-to-br from-teal-50 to-teal-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-100/50 to-teal-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 border-2 border-teal-600 shadow-lg group-hover:scale-110 transition-transform">
                <Timer className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-teal-800 bg-white px-3 py-1 rounded-full border border-teal-300 shadow-sm">Duración</span>
            </div>
            <p className="text-3xl font-bold text-teal-900 tabular-nums mb-2">{Math.round(avgDuration || 0)}m</p>
            <p className="text-sm text-teal-700 font-medium">Duración promedio</p>
          </div>
        </div>

        {/* Total Services in Packages */}
        <div className="relative overflow-hidden rounded-xl border-2 border-green-500/30 bg-gradient-to-br from-green-50 to-green-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-green-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 border-2 border-green-600 shadow-lg group-hover:scale-110 transition-transform">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-green-800 bg-white px-3 py-1 rounded-full border border-green-300 shadow-sm">Servicios</span>
            </div>
            <p className="text-3xl font-bold text-green-900 tabular-nums mb-2">{totalServicesInPackages}</p>
            <p className="text-sm text-green-700 font-medium">Servicios totales en paquetes</p>
          </div>
        </div>

        {/* Complex Packages */}
        <div className="relative overflow-hidden rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-50 to-amber-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-100/50 to-amber-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 border-2 border-amber-600 shadow-lg group-hover:scale-110 transition-transform">
                <Award className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-amber-800 bg-white px-3 py-1 rounded-full border border-amber-300 shadow-sm">Complejos</span>
            </div>
            <p className="text-3xl font-bold text-amber-900 tabular-nums mb-2">{complexPackages}</p>
            <p className="text-sm text-amber-700 font-medium">Paquetes complejos</p>
          </div>
        </div>
      </div>
    </>
  );
}
