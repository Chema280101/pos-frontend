import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUnitStore } from '@/store/unitStore';
import { EmptyStateData } from '@/components/ui/EmptyState';
import { Building2, Users, Package as PackageIcon, TrendingUp, Phone, Mail, MapPin, CheckCircle, AlertCircle, Activity, UserCheck } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    stockEntries: number;
  };
}

interface SupplierMetricsProps {
  suppliers: Supplier[];
}

export function SupplierMetrics({ suppliers }: SupplierMetricsProps) {
  const total = suppliers.length;
  const active = suppliers.filter(s => s.isActive).length;
  const inactive = suppliers.filter(s => !s.isActive).length;
  const withPhone = suppliers.filter(s => s.phone).length;
  const withEmail = suppliers.filter(s => s.email).length;
  const withAddress = suppliers.filter(s => s.address).length;
  const totalDeliveries = suppliers.reduce((sum, s) => sum + s._count.stockEntries, 0);
  const topSupplier = suppliers.length > 0 ? suppliers.reduce((max, s) => s._count.stockEntries > max._count.stockEntries ? s : max, suppliers[0]) : null;
  const recentSuppliers = suppliers.filter(s => {
    const createdDate = new Date(s.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return createdDate > thirtyDaysAgo;
  }).length;

  return (
    <>
      {/* First Row - 4 Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Suppliers */}
        <div className="relative overflow-hidden rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-50 to-blue-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-blue-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-blue-600 shadow-lg group-hover:scale-110 transition-transform">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-blue-800 bg-white px-3 py-1 rounded-full border border-blue-300 shadow-sm">Total</span>
            </div>
            <p className="text-3xl font-bold text-blue-900 tabular-nums mb-2">{total}</p>
            <p className="text-sm text-blue-700 font-medium">Proveedores totales</p>
          </div>
        </div>

        {/* Active Suppliers */}
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
            <p className="text-sm text-emerald-700 font-medium">Proveedores activos</p>
          </div>
        </div>

        {/* Total Deliveries */}
        <div className="relative overflow-hidden rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-50 to-purple-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-purple-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-purple-600 shadow-lg group-hover:scale-110 transition-transform">
                <PackageIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-purple-800 bg-white px-3 py-1 rounded-full border border-purple-300 shadow-sm">Entregas</span>
            </div>
            <p className="text-3xl font-bold text-purple-900 tabular-nums mb-2">{totalDeliveries}</p>
            <p className="text-sm text-purple-700 font-medium">Entregas totales</p>
          </div>
        </div>

        {/* Contact Quality */}
        <div className="relative overflow-hidden rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-50 to-amber-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-100/50 to-amber-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 border-2 border-amber-600 shadow-lg group-hover:scale-110 transition-transform">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-amber-800 bg-white px-3 py-1 rounded-full border border-amber-300 shadow-sm">Contacto</span>
            </div>
            <p className="text-3xl font-bold text-amber-900 tabular-nums mb-2">{withPhone}</p>
            <p className="text-sm text-amber-700 font-medium">Con teléfono</p>
          </div>
        </div>
      </div>

      {/* Second Row - 4 Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Recent Suppliers */}
        <div className="relative overflow-hidden rounded-xl border-2 border-green-500/30 bg-gradient-to-br from-green-50 to-green-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-green-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 border-2 border-green-600 shadow-lg group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-green-800 bg-white px-3 py-1 rounded-full border border-green-300 shadow-sm">Nuevos</span>
            </div>
            <p className="text-3xl font-bold text-green-900 tabular-nums mb-2">{recentSuppliers}</p>
            <p className="text-sm text-green-700 font-medium">Últimos 30 días</p>
          </div>
        </div>

        {/* Email Coverage */}
        <div className="relative overflow-hidden rounded-xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/50 to-indigo-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 border-2 border-indigo-600 shadow-lg group-hover:scale-110 transition-transform">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-indigo-800 bg-white px-3 py-1 rounded-full border border-indigo-300 shadow-sm">Email</span>
            </div>
            <p className="text-3xl font-bold text-indigo-900 tabular-nums mb-2">{withEmail}</p>
            <p className="text-sm text-indigo-700 font-medium">Con email</p>
          </div>
        </div>

        {/* Address Coverage */}
        <div className="relative overflow-hidden rounded-xl border-2 border-orange-500/30 bg-gradient-to-br from-orange-50 to-orange-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-100/50 to-orange-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 border-2 border-orange-600 shadow-lg group-hover:scale-110 transition-transform">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-orange-800 bg-white px-3 py-1 rounded-full border border-orange-300 shadow-sm">Dirección</span>
            </div>
            <p className="text-3xl font-bold text-orange-900 tabular-nums mb-2">{withAddress}</p>
            <p className="text-sm text-orange-700 font-medium">Con dirección</p>
          </div>
        </div>

        {/* Top Supplier */}
        <div className="relative overflow-hidden rounded-xl border-2 border-gray-500/30 bg-gradient-to-br from-gray-50 to-gray-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100/50 to-gray-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 border-2 border-gray-600 shadow-lg group-hover:scale-110 transition-transform">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-gray-800 bg-white px-3 py-1 rounded-full border border-gray-300 shadow-sm">Top</span>
            </div>
            <p className="text-lg font-bold text-gray-900 tabular-nums mb-1 truncate">
              {topSupplier ? topSupplier.name : 'N/A'}
            </p>
            <p className="text-sm text-gray-700 font-medium">
              {topSupplier ? `${topSupplier._count.stockEntries} entregas` : 'No hay datos'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
