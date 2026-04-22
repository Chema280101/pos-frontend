import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Banknote, CreditCard, ArrowRightLeft, Smartphone, TrendingUp, DollarSign, PlusCircle, Filter, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '@/lib/api';
import { useUnitStore } from '@/store/unitStore';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { Select } from '@/components/ui';
import { CashRegisterStatus } from '../CashRegisterStatus';
import type { CashRegisterOpen, BusinessUnit } from '@/types/cash';

interface CashRegisterHeaderProps {
  unit: BusinessUnit;
  onOpenRegister: (amount: string) => void;
  onShowExpense: () => void;
  onShowCashEntry: () => void;
  dateFrom: Date;
  dateTo: Date;
  onDateFromChange: (date: Date) => void;
  onDateToChange: (date: Date) => void;
  unitFilter: string;
  onUnitFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export function CashRegisterHeader({
  unit,
  onOpenRegister,
  onShowExpense,
  onShowCashEntry,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  unitFilter,
  onUnitFilterChange,
  statusFilter,
  onStatusFilterChange
}: CashRegisterHeaderProps) {
  const [showFilters, setShowFilters] = useState(false);
  
  // Obtener caja abierta
  const { data: openRegister, isLoading } = useQuery({
    queryKey: ['cash-register-open', unit],
    queryFn: async (): Promise<CashRegisterOpen | null> => {
      const { data } = await api.get<CashRegisterOpen | null>(`/api/cash-register/open?unit=${unit}`);
      return data;
    },
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 2 * 60 * 1000, // 2 minutos
  });

  // Obtener resumen de la unidad
  const { data: summary } = useQuery({
    queryKey: ['cash-register-summary', unit],
    queryFn: async () => {
      const { data } = await api.get(`/api/cash-register/summary?unit=${unit}`);
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // 5 minutos
  });

  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Caja Registradora</h1>
          <p className="text-gray-500 mt-1">Gestión de caja, egresos e ingresos</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            unit === 'SPA' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-amber-100 text-amber-800'
          }`}>
            {unit === 'SPA' ? 'SPA' : 'Barbería'}
          </span>
          <CashRegisterStatus 
            unit={unit}
            onOpenRegister={() => onOpenRegister('0')}
            onCloseRegister={() => {}}
          />
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Apertura</p>
                <p className="text-2xl font-bold text-gray-900">
                  S/ {summary.opening?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Banknote className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ventas Efectivo</p>
                <p className="text-2xl font-bold text-green-600">
                  S/ {(summary.cashFromSales || summary.cash || 0).toFixed(2)}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tarjetas</p>
                <p className="text-2xl font-bold text-blue-600">
                  S/ {summary.card?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Egresos</p>
                <p className="text-2xl font-bold text-red-600">
                  S/ {summary.expenses?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Acciones Rápidas */}
      {openRegister && (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onShowExpense()}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <TrendingUp className="h-4 w-4" />
            Agregar Egreso
          </button>
          
          <button
            onClick={() => onShowCashEntry()}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <DollarSign className="h-4 w-4" />
            Agregar Ingreso
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Filtros</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Ocultar' : 'Mostrar'} filtros
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Select
                label="Unidad"
                options={[
                  { value: '', label: 'Todas' },
                  { value: 'SPA', label: 'SPA' },
                  { value: 'BARBERIA', label: 'Barbería' }
                ]}
                value={unitFilter}
                onChange={(e) => onUnitFilterChange(e.target.value)}
              />
            </div>

            <div>
              <Select
                label="Estado"
                options={[
                  { value: '', label: 'Todos' },
                  { value: 'OPEN', label: 'Abierta' },
                  { value: 'CLOSED', label: 'Cerrada' }
                ]}
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value)}
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rango de fechas
              </label>
              <DateRangeFilter
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={(date) => date && onDateFromChange(date)}
                onDateToChange={(date) => date && onDateToChange(date)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
