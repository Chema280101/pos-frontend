import { useState } from 'react';
import { Calendar, Search, Filter, ChevronDown, Clock, RotateCcw, Sun, Moon, Building2, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateRangeFilterProps {
  // Date range state
  dateFrom: Date | null;
  dateTo: Date | null;
  onDateFromChange: (date: Date | null) => void;
  onDateToChange: (date: Date | null) => void;
  
  // Additional filters
  unit?: string;
  onUnitChange?: (unit: string) => void;
  status?: string;
  onStatusChange?: (status: string) => void;
  paymentMethod?: string;
  onPaymentMethodChange?: (method: string) => void;
  
  // Filter options
  showUnitFilter?: boolean;
  showStatusFilter?: boolean;
  showPaymentMethodFilter?: boolean;
  
  // Quick date ranges
  quickDateRanges?: Array<{
    label: string;
    icon: React.ReactNode;
    action: () => void;
  }>;
  
  // Styling
  className?: string;
}

const defaultQuickDateRanges = [
  { label: 'Todos', icon: <Filter className="h-3 w-3" />, action: (onDateFromChange: (date: Date | null) => void, onDateToChange: (date: Date | null) => void) => {
    onDateFromChange(null);
    onDateToChange(null);
  }},
  { label: 'Hoy', icon: <Sun className="h-3 w-3" />, action: (onDateFromChange: (date: Date | null) => void, onDateToChange: (date: Date | null) => void) => {
    const today = new Date();
    onDateFromChange(new Date(today.setHours(0, 0, 0, 0)));
    onDateToChange(new Date(today.setHours(23, 59, 59, 999)));
  }},
  { label: 'Ayer', icon: <Moon className="h-3 w-3" />, action: (onDateFromChange: (date: Date | null) => void, onDateToChange: (date: Date | null) => void) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    onDateFromChange(new Date(yesterday.setHours(0, 0, 0, 0)));
    onDateToChange(new Date(yesterday.setHours(23, 59, 59, 999)));
  }},
  { label: 'Últimos 7 días', icon: <RotateCcw className="h-3 w-3" />, action: (onDateFromChange: (date: Date | null) => void, onDateToChange: (date: Date | null) => void) => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    onDateFromChange(new Date(weekAgo.setHours(0, 0, 0, 0)));
    onDateToChange(new Date(today.setHours(23, 59, 59, 999)));
  }},
  { label: 'Este mes', icon: <Calendar className="h-3 w-3" />, action: (onDateFromChange: (date: Date | null) => void, onDateToChange: (date: Date | null) => void) => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    onDateFromChange(new Date(firstDay.setHours(0, 0, 0, 0)));
    onDateToChange(new Date(today.setHours(23, 59, 59, 999)));
  }},
  { label: 'Mes pasado', icon: <Clock className="h-3 w-3" />, action: (onDateFromChange: (date: Date | null) => void, onDateToChange: (date: Date | null) => void) => {
    const today = new Date();
    const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    onDateFromChange(new Date(firstDayLastMonth.setHours(0, 0, 0, 0)));
    onDateToChange(new Date(lastDayLastMonth.setHours(23, 59, 59, 999)));
  }},
];

export function DateRangeFilter({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  unit,
  onUnitChange,
  status,
  onStatusChange,
  paymentMethod,
  onPaymentMethodChange,
  showUnitFilter = true,
  showStatusFilter = false,
  showPaymentMethodFilter = false,
  quickDateRanges = defaultQuickDateRanges.map(range => ({
    ...range,
    action: () => range.action(onDateFromChange, onDateToChange)
  })),
  className,
}: DateRangeFilterProps): JSX.Element {
  
  const statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'PENDING', label: 'Pendientes' },
    { value: 'APPROVED', label: 'Aprobados' },
    { value: 'PAID', label: 'Pagados' },
  ];

  const paymentMethodOptions = [
    { value: '', label: 'Todos' },
    { value: 'Efectivo', label: 'Efectivo' },
    { value: 'Transferencia', label: 'Transferencia' },
    { value: 'Yape', label: 'Yape' },
    { value: 'Plin', label: 'Plin' },
    { value: 'Tarjeta', label: 'Tarjeta' },
    { value: 'Depósito', label: 'Depósito' },
  ];

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6", className)}>
      {/* Filter Header */}
      <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--unit-text)]">Filtros de Fecha</h3>
            <p className="text-sm text-[var(--unit-text-muted)]">Filtra por rango de fechas y categorías</p>
          </div>
        </div>
      </div>

      {/* Main Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Unit Filter */}
        {showUnitFilter && onUnitChange && (
          <div>
            <label className="block text-sm font-bold text-[var(--unit-text)] mb-2 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[var(--unit-accent)]" />
              Unidad
            </label>
            <select
              value={unit || ''}
              onChange={(e) => onUnitChange(e.target.value)}
              className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)] px-4 py-3 text-sm text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
            >
              <option value="">Todas</option>
              <option value="SPA">SPA</option>
              <option value="BARBERIA">Barbería</option>
            </select>
          </div>
        )}

        {/* Status Filter */}
        {showStatusFilter && onStatusChange && (
          <div>
            <label className="block text-sm font-bold text-[var(--unit-text)] mb-2 flex items-center gap-2">
              <Filter className="h-4 w-4 text-[var(--unit-accent)]" />
              Estado
            </label>
            <select
              value={status || ''}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)] px-4 py-3 text-sm text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Payment Method Filter */}
        {showPaymentMethodFilter && onPaymentMethodChange && (
          <div>
            <label className="block text-sm font-bold text-[var(--unit-text)] mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-[var(--unit-accent)]" />
              Método de Pago
            </label>
            <select
              value={paymentMethod || ''}
              onChange={(e) => onPaymentMethodChange(e.target.value)}
              className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)] px-4 py-3 text-sm text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
            >
              {paymentMethodOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date From */}
        <div>
          <label className="block text-sm font-bold text-[var(--unit-text)] mb-2 flex items-center gap-2">
            <Sun className="h-4 w-4 text-[var(--unit-accent)]" />
            Desde
          </label>
          <input
            type="date"
            value={dateFrom ? dateFrom.toISOString().split('T')[0] : ''}
            onChange={(e) => onDateFromChange(e.target.value ? new Date(e.target.value) : null)}
            className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)] px-4 py-3 text-sm text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-sm font-bold text-[var(--unit-text)] mb-2 flex items-center gap-2">
            <Moon className="h-4 w-4 text-[var(--unit-accent)]" />
            Hasta
          </label>
          <input
            type="date"
            value={dateTo ? dateTo.toISOString().split('T')[0] : ''}
            onChange={(e) => onDateToChange(e.target.value ? new Date(e.target.value) : null)}
            className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)] px-4 py-3 text-sm text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
          />
        </div>
      </div>

      {/* Quick Date Ranges */}
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-[var(--unit-accent)]" />
          <div className="text-sm font-bold text-[var(--unit-text)]">Rápidos</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickDateRanges.map((range, index) => (
            <button
              key={index}
              onClick={range.action}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)] text-[var(--unit-text)] hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10 hover:text-[var(--unit-accent)] transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] group"
            >
              <span className="transition-transform group-hover:scale-110">{range.icon}</span>
              {range.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
