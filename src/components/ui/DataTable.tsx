'use client';

import React, { useState, useMemo, type ReactNode } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface FilterOption {
  key: string;
  label: string;
  type: 'checkbox' | 'select';
  options?: { label: string; value: string | boolean }[];
}

export type ActionVariant =
  | 'view'
  | 'edit'
  | 'delete'
  | 'success'
  | 'pay'
  | 'refresh'
  | 'reset'
  | 'download'
  | 'export'
  | 'accent'
  | 'default';

export const getActionVariantClass = (variant?: ActionVariant, label?: string): string => {
  let v = variant;
  if (!v && label) {
    const l = label.toLowerCase();
    if (l.includes('ver') || l.includes('detail') || l.includes('detalle') || l.includes('mostrar') || l.includes('view') || l.includes('info')) {
      v = 'view';
    } else if (l.includes('edit') || l.includes('modificar') || l.includes('actualizar')) {
      v = 'edit';
    } else if (l.includes('eliminar') || l.includes('borrar') || l.includes('anular') || l.includes('delete') || l.includes('cancel')) {
      v = 'delete';
    } else if (l.includes('liquidar') || l.includes('pagar') || l.includes('desbloquear') || l.includes('activar') || l.includes('pay') || l.includes('confirm')) {
      v = 'success';
    } else if (l.includes('recalcular') || l.includes('reset') || l.includes('restablecer') || l.includes('refrescar') || l.includes('reactivar')) {
      v = 'refresh';
    } else if (l.includes('descargar') || l.includes('export') || l.includes('pdf') || l.includes('excel') || l.includes('imprimir') || l.includes('download')) {
      v = 'download';
    }
  }

  switch (v) {
    case 'view':
      return 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40 hover:text-blue-700 dark:hover:text-blue-300';
    case 'edit':
      return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 hover:text-amber-700 dark:hover:text-amber-300';
    case 'delete':
      return 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-700 dark:hover:text-rose-300';
    case 'success':
    case 'pay':
      return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 hover:text-emerald-700 dark:hover:text-emerald-300';
    case 'refresh':
    case 'reset':
      return 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/20 hover:border-sky-500/40 hover:text-sky-700 dark:hover:text-sky-300';
    case 'download':
    case 'export':
      return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 hover:text-emerald-700 dark:hover:text-emerald-300';
    case 'accent':
      return 'text-[var(--unit-accent)] bg-[var(--unit-accent)]/10 border-[var(--unit-accent)]/20 hover:bg-[var(--unit-accent)]/20 hover:border-[var(--unit-accent)]/40 hover:text-[var(--unit-accent-hover)]';
    default:
      return 'text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] border-[var(--unit-border)]/50 hover:border-[var(--unit-accent)]/60 hover:bg-[var(--unit-accent)]/10 hover:text-[var(--unit-accent)]';
  }
};

export interface Action<T> {
  label: string;
  icon: ReactNode;
  onClick: (row: T) => void;
  variant?: ActionVariant;
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
  disableInternalPagination?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  onPageChange?: (page: number) => void;
  // Responsive / View
  mobileCards?: boolean;
  density?: 'compact' | 'comfortable';
  onDensityChange?: (d: 'compact' | 'comfortable') => void;
  stickyHeader?: boolean;
  toolbar?: ReactNode;
  onResetFilters?: () => void;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  pageSize: initialPageSize = 15,
  pageSizeOptions = [10, 15, 25, 50, 100],
  searchPlaceholder = 'Buscar...',
  zebra = true,
  className,
  filters = [],
  actions = [],
  loading = false,
  emptyMessage = 'No se encontraron resultados para mostrar.',
  maxHeight = '600px',
  customFilterLogic,
  disableInternalPagination = false,
  pagination,
  onPageChange,
  mobileCards: externalMobileCards,
  density: controlledDensity,
  onDensityChange,
  stickyHeader = true,
  toolbar,
  onResetFilters,
}: DataTableProps<T>): JSX.Element {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [search, setSearch] = useState('');
  const [internalDensity, setInternalDensity] = useState<'compact' | 'comfortable'>('comfortable');

  const isMobile = useMediaQuery('(max-width: 768px)');
  const mobileCards = externalMobileCards ?? isMobile;

  const currentDensity = controlledDensity || internalDensity;

  const [filterValues, setFilterValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    filters.forEach((f) => {
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
      if (search) {
        const s = search.toLowerCase();
        result = result.filter((row) =>
          columns.some((col) => {
            const val = (row as Record<string, unknown>)[col.key];
            return val != null && String(val).toLowerCase().includes(s);
          })
        );
      }
      filters.forEach((f) => {
        const val = filterValues[f.key];
        if (f.type === 'checkbox' && val === true) {
          // Custom per filter if needed
        } else if (f.type === 'select' && val !== '') {
          result = result.filter((row) => {
            const rowVal = (row as Record<string, unknown>)[f.key];
            return String(rowVal) === val;
          });
        }
      });
    }

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

  const totalPages =
    disableInternalPagination && pagination
      ? pagination.totalPages
      : Math.max(1, Math.ceil(filteredData.length / pageSize));

  const paginatedData = useMemo(() => {
    if (disableInternalPagination) {
      return filteredData;
    }
    return filteredData.slice(page * pageSize, page * pageSize + pageSize);
  }, [filteredData, page, pageSize, disableInternalPagination]);

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
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const handleReset = () => {
    setSearch('');
    const resetValues: Record<string, any> = {};
    filters.forEach((f) => {
      if (f.type === 'checkbox') resetValues[f.key] = false;
      else if (f.type === 'select') resetValues[f.key] = '';
    });
    setFilterValues(resetValues);
    setPage(0);
    if (onResetFilters) onResetFilters();
  };

  const hasActiveFilters =
    Boolean(search) ||
    Object.values(filterValues).some((v) => v !== '' && v !== false && v != null);

  // Density styles mapping
  const densityStyles = {
    compact: {
      th: 'py-2.5 px-3 text-xs',
      td: 'py-2 px-3 text-xs',
      actionBtn: 'p-1.5',
    },
    comfortable: {
      th: 'py-3.5 px-4 text-sm',
      td: 'py-3 px-4 text-sm',
      actionBtn: 'p-2',
    },
  }[currentDensity];

  // Helper for column alignment
  const getAlignClass = (align?: 'left' | 'center' | 'right') => {
    if (align === 'right') return 'text-right justify-end tabular-nums';
    if (align === 'center') return 'text-center justify-center';
    return 'text-left justify-start';
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Custom Toolbar or Built-in Filters Bar */}
      {toolbar}

      {/* Built-in Filter Bar (only shown if filters prop has items and no custom toolbar is provided) */}
      {!toolbar && filters.length > 0 && (
        <div className="rounded-unit-lg border border-[var(--unit-border)]/50 bg-[var(--unit-surface)] p-4 shadow-unit">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {searchPlaceholder && (
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--unit-text-muted)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full h-10 rounded-unit border border-[var(--unit-border)]/50 bg-[var(--unit-surface-elevated)]/60 pl-10 pr-4 text-sm text-[var(--unit-text)] focus:outline-none focus:border-[var(--unit-accent)] transition-all placeholder:text-[var(--unit-text-muted)]/50"
                />
              </div>
            )}
            {filters.map((f) => (
              <div key={f.key} className="flex items-center gap-2">
                {f.type === 'checkbox' ? (
                  <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-[var(--unit-text)]">
                    <input
                      type="checkbox"
                      id={f.key}
                      checked={filterValues[f.key]}
                      onChange={(e) => handleFilterChange(f.key, e.target.checked)}
                      className="rounded-unit-sm border border-[var(--unit-border)]/50 text-[var(--unit-accent)] focus:ring-[var(--unit-accent)] w-4 h-4 cursor-pointer"
                      style={{ accentColor: 'var(--unit-accent)' }}
                    />
                    <span>{f.label}</span>
                  </label>
                ) : (
                  <select
                    value={filterValues[f.key]}
                    onChange={(e) => handleFilterChange(f.key, e.target.value)}
                    className="w-full h-10 rounded-unit border border-[var(--unit-border)]/50 bg-[var(--unit-surface-elevated)]/60 px-3.5 text-sm text-[var(--unit-text)] focus:outline-none focus:border-[var(--unit-accent)] transition-all cursor-pointer"
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

      {/* Main Table Container */}
      <div className="rounded-unit-lg border border-[var(--unit-border)]/60 bg-[var(--unit-surface)] shadow-unit overflow-hidden backdrop-blur-sm">
        <div style={{ maxHeight, overflowY: 'auto', overflowX: 'auto' }} className="relative">
          {loading ? (
            // Skeleton Loader
            <div className="p-5 space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex gap-4 items-center animate-pulse">
                  {columns.map((col, colIdx) => (
                    <div
                      key={col.key}
                      className={cn(
                        'h-6 bg-[var(--unit-surface-elevated)] rounded-unit-sm',
                        colIdx === 0 ? 'w-1/3' : 'flex-1'
                      )}
                    />
                  ))}
                  {actions.length > 0 && <div className="w-16 h-6 bg-[var(--unit-surface-elevated)] rounded-unit-sm" />}
                </div>
              ))}
            </div>
          ) : mobileCards ? (
            // Mobile Cards View
            <div className="space-y-3 p-3">
              {paginatedData.map((row) => (
                <div
                  key={keyExtractor(row)}
                  className="bg-[var(--unit-surface-elevated)]/50 border border-[var(--unit-border)]/40 rounded-unit p-4 shadow-unit hover:border-[var(--unit-accent)]/30 transition-all"
                >
                  <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[var(--unit-border)]/20">
                    <div className="font-bold text-sm text-[var(--unit-text)]">
                      {columns[0].render ? columns[0].render(row) : String(row[columns[0].key as keyof T] || '')}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 mb-3">
                    {columns.slice(1).map((col) => (
                      <div key={col.key} className="flex flex-col">
                        <span className="text-[10px] font-bold text-[var(--unit-text-muted)] uppercase tracking-wider">
                          {col.header}
                        </span>
                        <span className="text-xs text-[var(--unit-text)] mt-0.5">
                          {col.render ? col.render(row) : String(row[col.key as keyof T] || '—')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {actions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2.5 border-t border-[var(--unit-border)]/20 justify-end">
                      {actions.map((action, actionIndex) => {
                        const disabled = action.disabled ? action.disabled(row) : false;
                        const variantClass = getActionVariantClass(action.variant, action.label);
                        return (
                          <button
                            key={actionIndex}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(row);
                            }}
                            disabled={disabled}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-unit-sm border transition-all duration-200 hover:scale-105 active:scale-95 shadow-unit',
                              variantClass,
                              action.className,
                              disabled && 'opacity-40 cursor-not-allowed hover:scale-100 shadow-none pointer-events-none'
                            )}
                            title={action.label}
                            aria-label={`${action.label} para ${
                              (row as any).name || (row as any).id || (row as any).userName || (row as any).title || 'este elemento'
                            }`}
                          >
                            <span>{action.icon}</span>
                            <span>{action.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Desktop & Responsive Table
            <table className="w-full border-collapse text-left" style={{ tableLayout: 'auto' }}>
              <thead
                className={cn(
                  stickyHeader && 'sticky top-0 z-10 shadow-xs',
                  'bg-[var(--unit-surface-elevated)] border-b border-[var(--unit-border)]/40'
                )}
              >
                <tr>
                  {columns.map((col) => {
                    const alignClass = getAlignClass(col.align);
                    return (
                      <th
                        key={col.key}
                        onClick={() => col.sortable && handleSort(col.key)}
                        className={cn(
                          densityStyles.th,
                          'font-bold text-[var(--unit-text)] select-none whitespace-nowrap transition-colors',
                          col.sortable && 'cursor-pointer hover:bg-[var(--unit-accent)]/10',
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                          col.className
                        )}
                        style={{ width: col.width }}
                      >
                        <div className={cn('inline-flex items-center gap-1.5', alignClass)}>
                          <span>{col.header}</span>
                          {col.sortable && (
                            <span className="text-[var(--unit-text-muted)]">
                              {sortKey === col.key ? (
                                sortDir === 'asc' ? (
                                  <ChevronUp className="h-3.5 w-3.5 text-[var(--unit-accent)] font-bold" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5 text-[var(--unit-accent)] font-bold" />
                                )
                              ) : (
                                <span className="opacity-0 group-hover:opacity-40">↕</span>
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                  {actions.length > 0 && (
                    <th
                      className={cn(
                        densityStyles.th,
                        'text-center font-bold text-[var(--unit-text)] whitespace-nowrap'
                      )}
                      style={{ width: '130px' }}
                    >
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--unit-border)]/20">
                {paginatedData.map((row, index) => (
                  <tr
                    key={keyExtractor(row)}
                    className={cn(
                      'transition-colors duration-150 group',
                      zebra && index % 2 === 1
                        ? 'bg-[var(--unit-surface-elevated)]/30'
                        : 'bg-[var(--unit-surface)]',
                      'hover:bg-[var(--unit-accent)]/5'
                    )}
                  >
                    {columns.map((col) => {
                      const isRight = col.align === 'right';
                      const isCenter = col.align === 'center';
                      return (
                        <td
                          key={col.key}
                          className={cn(
                            densityStyles.td,
                            'text-[var(--unit-text)] font-normal transition-colors',
                            isRight ? 'text-right tabular-nums' : isCenter ? 'text-center' : 'text-left',
                            col.className
                          )}
                        >
                          {col.render
                            ? col.render(row)
                            : String((row as Record<string, unknown>)[col.key] ?? '—')}
                        </td>
                      );
                    })}
                    {actions.length > 0 && (
                      <td className={cn(densityStyles.td, 'text-center whitespace-nowrap')}>
                        <div className="inline-flex items-center justify-center gap-1.5">
                          {actions.map((action, i) => {
                            const disabled = action.disabled?.(row);
                            const variantClass = getActionVariantClass(action.variant, action.label);
                            return (
                              <button
                                key={i}
                                type="button"
                                disabled={disabled}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  action.onClick(row);
                                }}
                                className={cn(
                                  densityStyles.actionBtn,
                                  'rounded-unit border transition-all duration-200 hover:scale-105 active:scale-95 shadow-xs flex items-center justify-center',
                                  variantClass,
                                  action.className,
                                  disabled && 'opacity-40 cursor-not-allowed hover:scale-100 shadow-none pointer-events-none'
                                )}
                                title={action.label}
                                aria-label={`${action.label} para ${
                                  (row as any).name || (row as any).id || (row as any).userName || (row as any).title || 'este registro'
                                }`}
                              >
                                {action.icon}
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

          {/* Enhanced Empty State */}
          {filteredData.length === 0 && !loading && (
            <div className="px-6 py-12 text-center">
              <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                <div className="flex h-14 w-14 items-center justify-center rounded-unit bg-[var(--unit-surface-elevated)] border border-[var(--unit-border)]/40 text-[var(--unit-text-muted)] mb-3">
                  <Search className="h-6 w-6" />
                </div>
                <p className="text-base font-bold text-[var(--unit-text)] mb-1">{emptyMessage}</p>
                <p className="text-xs text-[var(--unit-text-muted)] mb-4">
                  {hasActiveFilters
                    ? 'No hay registros que coincidan con los filtros o términos de búsqueda aplicados.'
                    : 'Aún no se han registrado datos en esta sección.'}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-unit text-xs font-semibold bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/20 transition-all"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Restablecer búsqueda y filtros</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Integrated Low-Profile Footer */}
        {(!disableInternalPagination || pagination) && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-[var(--unit-surface-elevated)]/40 border-t border-[var(--unit-border)]/30 text-xs">
            {/* Records Summary */}
            <div className="flex items-center gap-2 text-[var(--unit-text-muted)] w-full sm:w-auto justify-center sm:justify-start order-2 sm:order-1">
              <span>
                Mostrando{' '}
                <strong className="text-[var(--unit-text)] font-semibold">
                  {filteredData.length === 0 ? 0 : page * pageSize + 1}-
                  {Math.min(
                    disableInternalPagination && pagination ? pagination.total : filteredData.length,
                    (page + 1) * pageSize
                  )}
                </strong>{' '}
                de{' '}
                <strong className="text-[var(--unit-text)] font-semibold">
                  {disableInternalPagination && pagination ? pagination.total : filteredData.length}
                </strong>{' '}
                <span className="hidden sm:inline">registros</span>
              </span>
            </div>

            {/* Pagination Controls & Rows Per Page */}
            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto justify-between sm:justify-end order-1 sm:order-2">
              {!disableInternalPagination && (
                <label className="flex items-center gap-1.5 text-[var(--unit-text-muted)]">
                  <span>Filas:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(0);
                    }}
                    className="h-8 rounded-lg border border-[var(--unit-border)]/60 bg-[var(--unit-surface)] px-2 text-xs text-[var(--unit-text)] focus:outline-none focus:border-[var(--unit-accent)] cursor-pointer"
                  >
                    {pageSizeOptions.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {/* Page navigation buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    if (disableInternalPagination && onPageChange && pagination) {
                      onPageChange(pagination.page - 1);
                    } else {
                      setPage((p) => Math.max(0, p - 1));
                    }
                  }}
                  disabled={
                    disableInternalPagination && pagination ? !pagination.hasPrev : page === 0
                  }
                  className="p-1.5 rounded-lg border border-[var(--unit-border)]/50 bg-[var(--unit-surface)] text-[var(--unit-text)] hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="px-2 text-xs font-semibold text-[var(--unit-text)]">
                  {disableInternalPagination && pagination ? pagination.page : page + 1} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    if (disableInternalPagination && onPageChange && pagination) {
                      onPageChange(pagination.page + 1);
                    } else {
                      setPage((p) => Math.min(totalPages - 1, p + 1));
                    }
                  }}
                  disabled={
                    disableInternalPagination && pagination
                      ? !pagination.hasNext
                      : page >= totalPages - 1
                  }
                  className="p-1.5 rounded-lg border border-[var(--unit-border)]/50 bg-[var(--unit-surface)] text-[var(--unit-text)] hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Página siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
