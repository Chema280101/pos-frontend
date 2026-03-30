'use client';

import React, { useState, useMemo, type ReactNode } from 'react';
import { Search, Filter, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface FilterOption {
  key: string;
  label: string;
  type: 'checkbox' | 'select';
  options?: { label: string; value: string | boolean }[];
}

export interface Action<T> {
  label: string;
  icon: ReactNode;
  onClick: (row: T) => void;
  className?: string;
  disabled?: (row: T) => boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  pageSize?: number;
  pageSizeOptions?: number[];
  searchPlaceholder?: string;
  zebra?: boolean;
  className?: string;
  filters?: FilterOption[];
  actions?: Action<T>[];
  loading?: boolean;
  emptyMessage?: string;
  maxHeight?: string;
  customFilterLogic?: (data: T[], filterValues: Record<string, any>) => T[];
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  searchPlaceholder = 'Buscar...',
  zebra = true,
  className,
  filters = [],
  actions = [],
  loading = false,
  emptyMessage = 'No hay datos para mostrar.',
  maxHeight = '600px',
  customFilterLogic,
}: DataTableProps<T>): JSX.Element {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    filters.forEach(f => {
      if (f.type === 'checkbox') initial[f.key] = false;
      else if (f.type === 'select') initial[f.key] = '';
    });
    return initial;
  });

  const sortedData = useMemo(() => {
    const dataArray = Array.isArray(data) ? data : [];
    if (!sortKey) return [...dataArray];
    const col = columns.find((c) => c.key === sortKey);
    if (!col || !col.sortable) return [...dataArray];
    return [...dataArray].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      const aCmp = aVal == null ? '' : String(aVal);
      const bCmp = bVal == null ? '' : String(bVal);
      const cmp = aCmp.localeCompare(bCmp, undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir, columns]);

  const filteredData = useMemo(() => {
    let result = sortedData;

    // Apply custom filter logic if provided
    if (customFilterLogic) {
      result = customFilterLogic(result, filterValues);
    } else {
      // Default filtering logic
      // Search
      if (search) {
        const s = search.toLowerCase();
        result = result.filter((row) =>
      columns.some((col) => {
        const val = (row as Record<string, unknown>)[col.key];
        return val != null && String(val).toLowerCase().includes(s);
      })
    );
      }
      // Filters
      filters.forEach(f => {
        const val = filterValues[f.key];
        if (f.type === 'checkbox' && val === true) {
          // Example: show inactive
          // Customize logic per filter if needed
        } else if (f.type === 'select' && val !== '') {
          result = result.filter((row) => {
            const rowVal = (row as Record<string, unknown>)[f.key];
            return String(rowVal) === val;
          });
        }
      });
    }

    // Apply search if customFilterLogic is provided (for search functionality)
    if (customFilterLogic && search) {
      const s = search.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) => {
          const val = (row as Record<string, unknown>)[col.key];
          return val != null && String(val).toLowerCase().includes(s);
        })
      );
    }

    return result;
  }, [sortedData, search, columns, filters, filterValues, customFilterLogic]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = useMemo(
    () => filteredData.slice(page * pageSize, page * pageSize + pageSize),
    [filteredData, page, pageSize]
  );

  const handleSort = (key: string): void => {
    const col = columns.find((c) => c.key === key);
    if (!col?.sortable) return;
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gradient-to-r from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] rounded-xl w-1/4"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-8 bg-gradient-to-r from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters Bar - Only show if filters are provided */}
      {filters.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6">
          {/* Filter Header */}
          <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--unit-text)]">Filtros y Búsqueda</h3>
                <p className="text-sm text-[var(--unit-text-muted)]">Refina los resultados</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            {searchPlaceholder && (
              <div className="relative">
                <Search className="absolute left-4 top-3.5 h-4 w-4 text-[var(--unit-text-muted)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)] pl-11 pr-4 py-3 text-sm text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all placeholder:text-[var(--unit-text-muted)]/50"
                />
              </div>
            )}

            {/* Filters */}
            {filters.map(f => (
              <div key={f.key} className="flex items-center gap-2">
                {f.type === 'checkbox' ? (
                  <>
                    <input
                      type="checkbox"
                      id={f.key}
                      checked={filterValues[f.key]}
                      onChange={(e) => handleFilterChange(f.key, e.target.checked)}
                      className="rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)] text-[var(--unit-accent)] focus:ring-2 focus:ring-[var(--unit-accent)]/50 w-5 h-5"
                      style={{
                        accentColor: 'var(--unit-accent)'
                      }}
                    />
                    <label htmlFor={f.key} className="text-sm font-medium text-[var(--unit-text)]">
                      {f.label}
                    </label>
                  </>
                ) : (
                  <select
                    value={filterValues[f.key]}
                    onChange={(e) => handleFilterChange(f.key, e.target.value)}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)] px-4 py-3 text-sm text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                  >
                    <option value="">{f.label}</option>
                    {f.options?.map((opt: { label: string; value: string | boolean }) => (
                      <option key={String(opt.value)} value={String(opt.value)}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl">
        {/* Table Header */}
        <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                <Search className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--unit-text)]">Resultados</h3>
                <p className="text-sm text-[var(--unit-text-muted)]">
                  {filteredData.length} elemento{filteredData.length !== 1 ? 's' : ''} encontrados
                </p>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full bg-[var(--unit-accent)]/20 px-3 py-1.5 text-sm font-bold text-[var(--unit-accent)] border border-[var(--unit-accent)]/30 shadow-sm">
              Página {page + 1} de {totalPages}
            </span>
          </div>
        </div>

        <div style={{ maxHeight, overflowY: 'auto', overflowX: 'auto' }} className="bg-white/50">
          {loading ? (
            // Skeleton loader mientras carga
            <div className="p-6 space-y-4">
              {[...Array(pageSize)].map((_, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex gap-4 items-center">
                    {columns.map((col, colIndex) => (
                      <div 
                        key={col.key} 
                        className={`flex-1 ${colIndex === 0 ? 'w-1/3' : 'w-1/4'}`}
                      >
                        <div className="h-4 bg-[var(--unit-surface)] rounded animate-pulse mb-2"></div>
                        <div className="h-3 bg-[var(--unit-surface)]/70 rounded animate-pulse w-3/4"></div>
                      </div>
                    ))}
                    {actions.length > 0 && (
                      <div className="w-20 flex gap-2 justify-center">
                        {actions.map((_, actionIndex) => (
                          <div key={actionIndex} className="h-8 w-8 bg-[var(--unit-surface)] rounded-lg animate-pulse"></div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full border-collapse" style={{ tableLayout: 'fixed', minWidth: '800px' }}>
            <thead className="sticky top-0 z-10 bg-gradient-to-r from-[var(--unit-surface)] to-[var(--unit-surface-elevated)]">
              <tr>
                {columns.map((col, index) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={cn(
                      `px-6 py-4 ${index === 0 ? 'text-left' : 'text-center'} text-sm font-bold text-[var(--unit-text)] border-b border-[var(--unit-border)]/30`,
                      col.sortable && 'cursor-pointer hover:bg-[var(--unit-accent)]/10 transition-colors',
                      col.className
                    )}
                    style={{ minWidth: index === 0 ? '200px' : index === columns.length - 1 ? '120px' : '150px' }}
                  >
                    <div className={`flex items-center ${index === 0 ? 'justify-start' : 'justify-center'} gap-2`}>
                      {col.header}
                      {col.sortable && sortKey === col.key && (
                        sortDir === 'asc' ? <ChevronUp className="h-4 w-4 text-[var(--unit-accent)]" /> : <ChevronDown className="h-4 w-4 text-[var(--unit-accent)]" />
                      )}
                    </div>
                  </th>
                ))}
                {actions.length > 0 && (
                  <th className="px-6 py-4 text-center text-sm font-bold text-[var(--unit-text)] border-b border-[var(--unit-border)]/30" style={{ minWidth: '200px' }}>
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, index) => (
                <tr
                  key={keyExtractor(row)}
                  className={cn(
                    'border-b border-[var(--unit-border)]/20 transition-all duration-200 group',
                    zebra && index % 2 === 0 ? 'bg-white/30' : 'bg-white/50',
                    'hover:bg-gradient-to-r hover:from-[var(--unit-accent)]/5 hover:to-[var(--unit-primary)]/5 hover:shadow-sm'
                  )}
                >
                  {columns.map((col, index) => (
                    <td key={col.key} className={`px-6 py-4 text-sm text-[var(--unit-text)] ${index === 0 ? 'text-left' : 'text-center'} group-hover:text-[var(--unit-accent)] transition-colors`} style={{ minWidth: index === 0 ? '200px' : index === columns.length - 1 ? '120px' : '150px' }}>
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td className="px-6 py-4 text-center" style={{ minWidth: '200px' }}>
                      <div className="flex items-center justify-center gap-2">
                        {actions.map((action, i) => {
                          const disabled = action.disabled?.(row);
                          return (
                            <button
                              key={i}
                              type="button"
                              disabled={disabled}
                              onClick={() => action.onClick(row)}
                              className={cn(
                                'p-2 rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)] transition-all duration-200 group-hover:scale-110 group-hover:shadow-md',
                                action.className || 'text-[var(--unit-text)] hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10 hover:text-[var(--unit-accent)]',
                                disabled && 'opacity-50 cursor-not-allowed'
                              )}
                              title={action.label}
                              aria-label={`${action.label} para ${(row as any).name || (row as any).id || 'este elemento'}`}
                            >
                              <span className={cn(
                                'transition-all duration-200',
                                disabled && 'grayscale opacity-60'
                              )}>
                                {action.icon}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          )}
          {filteredData.length === 0 && !loading && (
            <div className="px-6 py-12 text-center">
              <div className="flex flex-col items-center justify-center">
                <Search className="h-12 w-12 text-[var(--unit-text-muted)]/30 mb-4" />
                <p className="text-lg font-medium text-[var(--unit-text)] mb-2">{emptyMessage}</p>
                <p className="text-sm text-[var(--unit-text-muted)]">
                  Intenta ajustar los filtros o términos de búsqueda
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
              <Filter className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--unit-text)]">
                Total: <span className="font-bold text-[var(--unit-accent)]">{filteredData.length}</span> resultados
              </p>
              <p className="text-xs text-[var(--unit-text-muted)]">
                Página {page + 1} de {totalPages}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--unit-text)]">
              Filas:
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(0);
                }}
                className="rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)] px-4 py-2 text-sm text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
              >
                {pageSizeOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)] text-[var(--unit-text)] font-medium transition-all hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10 hover:text-[var(--unit-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)] text-[var(--unit-text)] font-medium transition-all hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10 hover:text-[var(--unit-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
