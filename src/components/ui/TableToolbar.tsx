'use client';

import React, { useState, type ReactNode } from 'react';
import { Search, X, Filter, RotateCcw, SlidersHorizontal, LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QuickChip {
  id: string | number;
  label: string;
  count?: number;
  icon?: ReactNode;
  activeColor?: string; // Optional custom active badge color class
}

export interface TableToolbarProps {
  // Search
  search?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;

  // Quick Chips / Segmented Control
  chips?: QuickChip[];
  activeChip?: string | number;
  onChipChange?: (id: string | number) => void;

  // Advanced Filters
  showAdvancedFiltersButton?: boolean;
  isAdvancedOpen?: boolean;
  onToggleAdvanced?: () => void;
  activeFiltersCount?: number;
  onResetFilters?: () => void;
  advancedFiltersContent?: ReactNode;

  // Density Toggle
  density?: 'compact' | 'comfortable';
  onDensityChange?: (d: 'compact' | 'comfortable') => void;
  showDensityToggle?: boolean;

  // Actions (e.g., Export buttons, New item)
  actions?: ReactNode;

  // Secondary info / summary badge (e.g. "45 registros")
  totalRecords?: number;

  className?: string;
}

export function TableToolbar({
  search = '',
  onSearchChange,
  searchPlaceholder = 'Buscar en la tabla...',
  showSearch = true,
  chips = [],
  activeChip,
  onChipChange,
  showAdvancedFiltersButton = false,
  isAdvancedOpen = false,
  onToggleAdvanced,
  activeFiltersCount = 0,
  onResetFilters,
  advancedFiltersContent,
  density = 'comfortable',
  onDensityChange,
  showDensityToggle = false,
  actions,
  totalRecords,
  className,
}: TableToolbarProps): JSX.Element {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Main Toolbar Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-[var(--unit-surface)] border border-[var(--unit-border)]/50 rounded-unit-lg p-3 shadow-sm backdrop-blur-sm">
        {/* Left Side: Search + Quick Chips */}
        <div className="flex flex-col sm:flex-row flex-1 w-full items-start sm:items-center gap-2.5">
          {/* Search Box */}
          {showSearch && onSearchChange && (
            <div className="relative w-full sm:max-w-md sm:flex-1 shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--unit-text-muted)] pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') onSearchChange('');
                }}
                placeholder={searchPlaceholder}
                className="w-full h-10 pl-10 pr-9 rounded-unit border border-[var(--unit-border)]/60 bg-[var(--unit-surface-elevated)]/60 text-sm text-[var(--unit-text)] placeholder-[var(--unit-text-muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/40 focus:border-[var(--unit-accent)] transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[var(--unit-text-muted)] hover:text-[var(--unit-text)] hover:bg-[var(--unit-border)]/30 transition-all"
                  title="Limpiar búsqueda (Esc)"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Quick Filter Chips / Segmented Control */}
          {chips.length > 0 && onChipChange && (
            <div className="flex items-center gap-1.5 p-1 w-full sm:w-auto rounded-unit bg-[var(--unit-surface-elevated)]/70 border border-[var(--unit-border)]/40 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {chips.map((chip) => {
                const isActive = activeChip === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => onChipChange(chip.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150',
                      isActive
                        ? chip.activeColor || 'bg-[var(--unit-accent)] text-white shadow-sm'
                        : 'text-[var(--unit-text-muted)] hover:text-[var(--unit-text)] hover:bg-[var(--unit-surface)]/80'
                    )}
                  >
                    {chip.icon && <span className="shrink-0">{chip.icon}</span>}
                    <span>{chip.label}</span>
                    {chip.count !== undefined && (
                      <span
                        className={cn(
                          'ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums',
                          isActive ? 'bg-white/20 text-white' : 'bg-[var(--unit-border)]/50 text-[var(--unit-text-muted)]'
                        )}
                      >
                        {chip.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Filters, Density & Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Advanced Filters Button */}
          {showAdvancedFiltersButton && onToggleAdvanced && (
            <button
              type="button"
              onClick={onToggleAdvanced}
              className={cn(
                'inline-flex items-center gap-2 h-10 px-3.5 rounded-unit border text-xs font-semibold transition-all duration-150',
                isAdvancedOpen || activeFiltersCount > 0
                  ? 'border-[var(--unit-accent)]/50 bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] shadow-sm'
                  : 'border-[var(--unit-border)]/60 bg-[var(--unit-surface-elevated)] text-[var(--unit-text)] hover:border-[var(--unit-border)] hover:bg-[var(--unit-surface-elevated)]/90'
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--unit-accent)] text-[10px] font-bold text-white tabular-nums">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          )}

          {/* Reset Filters Quick Button if filters active */}
          {activeFiltersCount > 0 && onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 h-10 px-3 rounded-unit border border-rose-500/30 bg-rose-500/10 text-rose-600 text-xs font-semibold hover:bg-rose-500/20 transition-all"
              title="Restablecer todos los filtros"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          )}

          {/* Density Toggle Button */}
          {showDensityToggle && onDensityChange && (
            <div className="hidden lg:flex items-center border border-[var(--unit-border)]/50 rounded-unit bg-[var(--unit-surface-elevated)] p-0.5">
              <button
                type="button"
                onClick={() => onDensityChange('compact')}
                className={cn(
                  'p-1.5 rounded-lg text-xs transition-all',
                  density === 'compact'
                    ? 'bg-[var(--unit-surface)] text-[var(--unit-accent)] shadow-xs'
                    : 'text-[var(--unit-text-muted)] hover:text-[var(--unit-text)]'
                )}
                title="Vista compacta"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onDensityChange('comfortable')}
                className={cn(
                  'p-1.5 rounded-lg text-xs transition-all',
                  density === 'comfortable'
                    ? 'bg-[var(--unit-surface)] text-[var(--unit-accent)] shadow-xs'
                    : 'text-[var(--unit-text-muted)] hover:text-[var(--unit-text)]'
                )}
                title="Vista estándar"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Slot for Global Actions (Export, New item, etc.) */}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>

      {/* Advanced Filters Expandable Drawer / Panel */}
      {showAdvancedFiltersButton && isAdvancedOpen && advancedFiltersContent && (
        <div className="p-4 rounded-unit-lg border border-[var(--unit-border)]/60 bg-[var(--unit-surface)] shadow-unit animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--unit-border)]/30">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[var(--unit-accent)]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--unit-text)]">
                Filtros Avanzados
              </span>
            </div>
            {onResetFilters && activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={onResetFilters}
                className="text-xs font-medium text-rose-500 hover:text-rose-600 underline"
              >
                Restablecer filtros
              </button>
            )}
          </div>
          {advancedFiltersContent}
        </div>
      )}
    </div>
  );
}
