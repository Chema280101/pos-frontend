import { useState, useEffect } from 'react';
import { Search, Filter, ArrowUpDown, Users, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { Select } from '@/components/ui';
import { startOfDay, endOfDay, subDays } from 'date-fns';

interface ClientsFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  statusFilter: 'all' | 'active' | 'blocked';
  setStatusFilter: (value: 'all' | 'active' | 'blocked') => void;
  creditFilter: 'all' | 'hasCredit' | 'noCredit';
  setCreditFilter: (value: 'all' | 'hasCredit' | 'noCredit') => void;
  sortBy: 'name' | 'credit' | 'recent';
  setSortBy: (value: 'name' | 'credit' | 'recent') => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (value: 'asc' | 'desc') => void;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
  dateFrom: Date;
  setDateFrom: (value: Date) => void;
  dateTo: Date;
  setDateTo: (value: Date) => void;
  unitFilter: string;
  setUnitFilter: (value: string) => void;
}

export function ClientsFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  creditFilter,
  setCreditFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  showFilters,
  setShowFilters,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  unitFilter,
  setUnitFilter,
}: ClientsFiltersProps) {
  // Debounce hook para búsqueda
  function useDebouncedValue<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
      const t = setTimeout(() => setDebounced(value), delay);
      return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
  }
  
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  
  // Actualizar el search parent con debounced value
  useEffect(() => {
    if (debouncedSearch !== search) {
      setSearch(debouncedSearch);
    }
  }, [debouncedSearch, setSearch]);
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      {/* Filter Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-gray-700">Filtros</span>
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {showFilters ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Ocultar filtros
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Mostrar filtros
            </>
          )}
        </button>
      </div>

      {/* Filter Content */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Status Filter */}
          <Select
            label="Estado"
            options={[
              { value: 'all', label: 'Todos los estados' },
              { value: 'active', label: 'Activos' },
              { value: 'blocked', label: 'Bloqueados' }
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'blocked')}
          />

          {/* Credit Filter */}
          <Select
            label="Crédito"
            options={[
              { value: 'all', label: 'Todo el crédito' },
              { value: 'hasCredit', label: 'Con crédito' },
              { value: 'noCredit', label: 'Sin crédito' }
            ]}
            value={creditFilter}
            onChange={(e) => setCreditFilter(e.target.value as 'all' | 'hasCredit' | 'noCredit')}
          />

          {/* Unit Filter */}
          <Select
            label="Unidad"
            options={[
              { value: '', label: 'Todas las unidades' },
              { value: 'SPA', label: 'SPA' },
              { value: 'BARBERIA', label: 'Barbería' }
            ]}
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
          />

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <Select
              label="Ordenar por"
              options={[
                { value: 'name', label: 'Nombre' },
                { value: 'credit', label: 'Crédito' },
                { value: 'recent', label: 'Reciente' }
              ]}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'credit' | 'recent')}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowUpDown className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* Date Range */}
          <div className="lg:col-span-2">
            <DateRangeFilter
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={(date) => date && setDateFrom(date)}
              onDateToChange={(date) => date && setDateTo(date)}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
