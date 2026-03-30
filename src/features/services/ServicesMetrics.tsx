import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUnitStore } from '@/store/unitStore';
import { EmptyStateData } from '@/components/ui/EmptyState';
import { TrendingUp, TrendingDown, Minus, Package, DollarSign, Clock, Star, Activity, CheckCircle, Timer, Award } from 'lucide-react';
import type { Service } from '@/types/service';

interface ServicesMetricsProps {
  services: Service[];
}

export function ServicesMetrics({ services }: ServicesMetricsProps) {
  const total = services.length;
  const active = services.filter(s => s.isActive).length;
  const inactive = services.filter(s => !s.isActive).length;
  const avgPrice = services.length > 0 ? services.reduce((sum, s) => sum + s.price, 0) / services.length : 0;
  const avgDuration = services.length > 0 ? services.reduce((sum, s) => sum + s.durationMin, 0) / services.length : 0;
  const totalRevenue = services.reduce((sum, s) => sum + (s.price * s.timesVended), 0);
  const mostPopular = services.length > 0 ? services.reduce((max, s) => s.timesVended > (max?.timesVended || 0) ? s : max, services[0]) : null;
  const comboEligible = services.filter(s => s.isComboEligible).length;
  
  // Additional metrics
  const highPricedServices = services.filter(s => s.price > avgPrice * 1.5).length;
  const longDurationServices = services.filter(s => s.durationMin > avgDuration * 1.5).length;
  const neverSoldServices = services.filter(s => s.timesVended === 0).length;
  const topPerformers = services.filter(s => s.timesVended > 10).length;
  const avgTimesVended = services.length > 0 ? services.reduce((sum, s) => sum + s.timesVended, 0) / services.length : 0;

  return (
    <>
      {/* First Row - 4 Core Services Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Services */}
        <div className="relative overflow-hidden rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-50 to-blue-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-blue-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-blue-600 shadow-lg group-hover:scale-110 transition-transform">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-blue-800 bg-white px-3 py-1 rounded-full border border-blue-300 shadow-sm">Total</span>
            </div>
            <p className="text-3xl font-bold text-blue-900 tabular-nums mb-2">{total}</p>
            <p className="text-sm text-blue-700 font-medium">Servicios totales</p>
          </div>
        </div>

        {/* Active Services */}
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
            <p className="text-sm text-emerald-700 font-medium">Servicios activos</p>
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

        {/* Total Revenue */}
        <div className="relative overflow-hidden rounded-xl border-2 border-orange-500/30 bg-gradient-to-br from-orange-50 to-orange-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-100/50 to-orange-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 border-2 border-orange-600 shadow-lg group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-orange-800 bg-white px-3 py-1 rounded-full border border-orange-300 shadow-sm">Ingresos</span>
            </div>
            <p className="text-3xl font-bold text-orange-900 tabular-nums mb-2">S/{Number(totalRevenue || 0).toFixed(2)}</p>
            <p className="text-sm text-orange-700 font-medium">Ingresos totales</p>
          </div>
        </div>
      </div>

      {/* Second Row - 4 Additional Services Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Most Popular Service */}
        <div className="relative overflow-hidden rounded-xl border-2 border-pink-500/30 bg-gradient-to-br from-pink-50 to-pink-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-100/50 to-pink-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 border-2 border-pink-600 shadow-lg group-hover:scale-110 transition-transform">
                <Star className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-pink-800 bg-white px-3 py-1 rounded-full border border-pink-300 shadow-sm">Popular</span>
            </div>
            <p className="text-lg font-bold text-pink-900 tabular-nums mb-1 truncate">
              {mostPopular ? mostPopular.name.slice(0, 15) : 'N/A'}
            </p>
            <p className="text-sm text-pink-700 font-medium">
              {mostPopular ? `${mostPopular.timesVended} ventas` : 'No hay datos'}
            </p>
          </div>
        </div>

        {/* Average Duration */}
        <div className="relative overflow-hidden rounded-xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/50 to-indigo-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 border-2 border-indigo-600 shadow-lg group-hover:scale-110 transition-transform">
                <Timer className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-indigo-800 bg-white px-3 py-1 rounded-full border border-indigo-300 shadow-sm">Duración</span>
            </div>
            <p className="text-3xl font-bold text-indigo-900 tabular-nums mb-2">{Math.round(avgDuration || 0)}m</p>
            <p className="text-sm text-indigo-700 font-medium">Duración promedio</p>
          </div>
        </div>

        {/* Combo Eligible */}
        <div className="relative overflow-hidden rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-50 to-amber-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-100/50 to-amber-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 border-2 border-amber-600 shadow-lg group-hover:scale-110 transition-transform">
                <Package className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-amber-800 bg-white px-3 py-1 rounded-full border border-amber-300 shadow-sm">Combos</span>
            </div>
            <p className="text-3xl font-bold text-amber-900 tabular-nums mb-2">{comboEligible}</p>
            <p className="text-sm text-amber-700 font-medium">Servicios para combos</p>
          </div>
        </div>

        {/* Top Performers */}
        <div className="relative overflow-hidden rounded-xl border-2 border-teal-500/30 bg-gradient-to-br from-teal-50 to-teal-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-100/50 to-teal-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 border-2 border-teal-600 shadow-lg group-hover:scale-110 transition-transform">
                <Award className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-teal-800 bg-white px-3 py-1 rounded-full border border-teal-300 shadow-sm">Éxito</span>
            </div>
            <p className="text-3xl font-bold text-teal-900 tabular-nums mb-2">{topPerformers}</p>
            <p className="text-sm text-teal-700 font-medium">Servicios con 10+ ventas</p>
          </div>
        </div>
      </div>
    </>
  );
}
