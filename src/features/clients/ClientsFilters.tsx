import { useState } from 'react';
import { Search, Filter, ArrowUpDown, Users, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'blocked')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="blocked">Bloqueados</option>
          </select>

          {/* Credit Filter */}
          <select
            value={creditFilter}
            onChange={(e) => setCreditFilter(e.target.value as 'all' | 'hasCredit' | 'noCredit')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">Todo el crédito</option>
            <option value="hasCredit">Con crédito</option>
            <option value="noCredit">Sin crédito</option>
          </select>

          {/* Unit Filter */}
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">Todas las unidades</option>
            <option value="SPA">SPA</option>
            <option value="BARBERIA">Barbería</option>
          </select>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'credit' | 'recent')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="name">Nombre</option>
              <option value="credit">Crédito</option>
              <option value="recent">Reciente</option>
            </select>
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
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
