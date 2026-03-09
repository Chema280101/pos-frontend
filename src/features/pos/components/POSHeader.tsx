'use client';

import { Store, TrendingUp, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { BusinessUnit } from '@/types/pos';

interface POSHeaderProps {
  unit: BusinessUnit;
  onUnitChange: (unit: BusinessUnit) => void;
  totalSales: number;
  pendingCount: number;
}

export function POSHeader({ unit, onUnitChange, totalSales, pendingCount }: POSHeaderProps) {
  const currentDate = format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es });
  const currentTime = format(new Date(), 'HH:mm:ss');

  const getUnitLabel = (unit: BusinessUnit) => {
    switch (unit) {
      case 'SPA': return 'SPA';
      case 'BARBERIA': return 'Barbería';
      default: return unit;
    }
  };

  const getUnitColor = (unit: BusinessUnit) => {
    switch (unit) {
      case 'SPA': return 'from-purple-500 to-purple-600';
      case 'BARBERIA': return 'from-amber-500 to-amber-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/98 to-white/95 backdrop-blur-sm shadow-xl p-6 mb-6">
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-surface)]/50 to-[var(--unit-surface-elevated)]/50 rounded-2xl"></div>
      
      <div className="relative">
        {/* Main Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${getUnitColor(unit)} shadow-lg`}>
              <Store className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--unit-text)]">Punto de Venta</h1>
              <p className="text-sm text-[var(--unit-text-muted)]">Sistema de gestión comercial</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Unit Selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-[var(--unit-text)]">Unidad:</label>
              <select
                value={unit}
                onChange={(e) => onUnitChange(e.target.value as BusinessUnit)}
                className={`px-4 py-2 rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br ${getUnitColor(unit)} text-white font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-white/20 transition-all`}
              >
                <option value="SPA" className="text-gray-800">SPA</option>
                <option value="BARBERIA" className="text-gray-800">Barbería</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date & Time */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/20 border border-blue-500/30">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-blue-600/80">Fecha</p>
              <p className="text-sm font-semibold text-blue-800">{currentDate}</p>
            </div>
          </div>

          {/* Current Time */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/20 border border-green-500/30">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/20">
              <Clock className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-green-600/80">Hora</p>
              <p className="text-sm font-semibold text-green-800">{currentTime}</p>
            </div>
          </div>

          {/* Pending Sales */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/20 border border-amber-500/30">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20">
              <TrendingUp className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-amber-600/80">Ventas Pendientes</p>
              <p className="text-sm font-semibold text-amber-800">{pendingCount}</p>
            </div>
          </div>

          {/* Today's Total */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/20 border border-emerald-500/30">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-emerald-600/80">Total del Día</p>
              <p className="text-sm font-semibold text-emerald-800">S/ {totalSales.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
