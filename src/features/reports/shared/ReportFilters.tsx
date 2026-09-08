import { useState } from 'react';
import { Calendar, Search, Filter, ChevronDown, Clock, RotateCcw, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportFiltersProps {
  unit: string;
  dateFrom: Date;
  dateTo: Date;
  onUnitChange: (unit: string) => void;
  onDateFromChange: (date: Date) => void;
  onDateToChange: (date: Date) => void;
  showReportType?: boolean;
  reportType?: string;
  onReportTypeChange?: (type: string) => void;
}

export function ReportFilters({
  unit,
  dateFrom,
  dateTo,
  onUnitChange,
  onDateFromChange,
  onDateToChange,
  showReportType = true,
  reportType = 'overview',
  onReportTypeChange,
}: ReportFiltersProps): JSX.Element {
  const quickDateRanges = [
    { label: 'Hoy', icon: <Sun className="h-3 w-3" />, action: () => {
      const today = new Date();
      onDateFromChange(new Date(today.setHours(0, 0, 0, 0)));
      onDateToChange(new Date(today.setHours(23, 59, 59, 999)));
    }},
    { label: 'Ayer', icon: <Moon className="h-3 w-3" />, action: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      onDateFromChange(new Date(yesterday.setHours(0, 0, 0, 0)));
      onDateToChange(new Date(yesterday.setHours(23, 59, 59, 999)));
    }},
    { label: 'Últimos 7 días', icon: <RotateCcw className="h-3 w-3" />, action: () => {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      onDateFromChange(new Date(weekAgo.setHours(0, 0, 0, 0)));
      onDateToChange(new Date(today.setHours(23, 59, 59, 999)));
    }},
    { label: 'Este mes', icon: <Calendar className="h-3 w-3" />, action: () => {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      onDateFromChange(new Date(firstDay.setHours(0, 0, 0, 0)));
      onDateToChange(new Date(today.setHours(23, 59, 59, 999)));
    }},
    { label: 'Mes pasado', icon: <Clock className="h-3 w-3" />, action: () => {
      const today = new Date();
      const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      onDateFromChange(new Date(firstDayLastMonth.setHours(0, 0, 0, 0)));
      onDateToChange(new Date(lastDayLastMonth.setHours(23, 59, 59, 999)));
    }},
  ];

  const reportTypes = [
    { value: 'overview', label: 'General', description: 'Resumen completo del sistema' },
    { value: 'sales', label: 'Ventas', description: 'Reporte de ventas detallado' },
    { value: 'appointments', label: 'Citas', description: 'Agenda y asistencia' },
    { value: 'clients', label: 'Clientes', description: 'Métricas de clientes' },
    { value: 'inventory', label: 'Inventario', description: 'Stock y productos' },
    { value: 'commissions', label: 'Comisiones', description: 'Comisiones de empleados' },
    { value: 'cash-register', label: 'Cajas', description: 'Auditoría de cajas' },
  ];

  return (
    <div className="bg-[var(--unit-surface-elevated)] rounded-unit-lg border border-[var(--unit-border)] p-4 space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Unit Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-[var(--unit-text)] mb-1">
            Unidad
          </label>
          <select
            value={unit}
            onChange={(e) => onUnitChange(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--unit-border)] rounded-unit-lg focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]"
          >
            <option value="">Todas</option>
            <option value="SPA">SPA</option>
            <option value="BARBERIA">Barbería</option>
          </select>
        </div>

        {/* Date Range */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-[var(--unit-text)] mb-1">
            Desde
          </label>
          <input
            type="date"
            value={dateFrom.toISOString().split('T')[0]}
            onChange={(e) => onDateFromChange(new Date(e.target.value))}
            className="w-full px-3 py-2 border border-[var(--unit-border)] rounded-unit-lg focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]"
          />
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-[var(--unit-text)] mb-1">
            Hasta
          </label>
          <input
            type="date"
            value={dateTo.toISOString().split('T')[0]}
            onChange={(e) => onDateToChange(new Date(e.target.value))}
            className="w-full px-3 py-2 border border-[var(--unit-border)] rounded-unit-lg focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]"
          />
        </div>

        {/* Report Type (if shown) */}
        {showReportType && onReportTypeChange && (
          <div className="flex-1">
            <label className="block text-sm font-medium text-[var(--unit-text)] mb-1">
              Tipo de Reporte
            </label>
            <select
              value={reportType}
              onChange={(e) => onReportTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--unit-border)] rounded-unit-lg focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]"
            >
              {reportTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Quick Date Ranges */}
      <div className="flex flex-wrap gap-2">
        {quickDateRanges.map((range, index) => (
          <button
            key={index}
            onClick={range.action}
            className="flex items-center gap-1 px-3 py-1 text-sm border border-[var(--unit-border)] rounded-unit-lg hover:bg-[var(--unit-primary)]/10 transition-colors"
          >
            {range.icon}
            {range.label}
          </button>
        ))}
      </div>
    </div>
  );
}
