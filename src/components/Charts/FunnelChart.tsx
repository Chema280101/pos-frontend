'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface FunnelItemDatum {
  stage: string;
  count: number;
  [key: string]: any;
}

export interface FunnelChartProps {
  data: FunnelItemDatum[];
  height?: number;
  primaryColor?: string;
  onStageClick?: (item: FunnelItemDatum) => void;
}

const STAGE_CONFIGS: Record<string, { label: string; color: string; badge: string }> = {
  'Programadas': { label: 'Programadas', color: 'from-blue-500 to-indigo-600', badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' },
  'En curso': { label: 'En Curso', color: 'from-amber-500 to-orange-600', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' },
  'Completadas': { label: 'Completadas', color: 'from-emerald-500 to-teal-600', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' },
  'Convertidas en venta': { label: 'Facturadas', color: 'from-purple-500 to-violet-600', badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300' },
};

export function FunnelChart({
  data,
  height = 300,
  onStageClick,
}: FunnelChartProps): JSX.Element {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[280px] w-full text-center p-6 rounded-unit border border-dashed border-[var(--unit-border)]/60">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--unit-surface)] mb-3 text-[var(--unit-text-muted)]">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </div>
        <h4 className="text-sm font-semibold text-[var(--unit-text)]">Sin datos de embudo</h4>
        <p className="text-xs text-[var(--unit-text-muted)] max-w-xs mt-1">
          No hay citas registradas en el período.
        </p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const initialCount = data[0]?.count || 0;

  return (
    <div className="flex flex-col justify-around py-2 px-1 gap-3.5" style={{ minHeight: height }}>
      {data.map((item, index) => {
        const config = STAGE_CONFIGS[item.stage] || {
          label: item.stage,
          color: 'from-blue-500 to-indigo-600',
          badge: 'bg-[var(--unit-surface)] text-[var(--unit-text)]',
        };

        const widthPercentage = Math.max(12, Math.round((item.count / maxCount) * 100));
        const conversionRate =
          initialCount > 0
            ? Math.round((item.count / initialCount) * 100)
            : 0;

        return (
          <div
            key={`stage-${index}`}
            onClick={() => onStageClick && onStageClick(item)}
            className={`group flex flex-col gap-1.5 transition-all ${
              onStageClick ? 'cursor-pointer hover:opacity-90' : ''
            }`}
          >
            <div className="flex items-center justify-between text-xs font-medium">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${config.badge}`}>
                  {config.label}
                </span>
                {index > 0 && (
                  <span className="text-[10px] text-[var(--unit-text-muted)]">
                    ({conversionRate}% del total inicial)
                  </span>
                )}
              </div>
              <span className="font-bold text-[var(--unit-text)] text-sm">
                {item.count}{' '}
                <span className="text-xs font-normal text-[var(--unit-text-muted)]">
                  {item.count === 1 ? 'cita' : 'citas'}
                </span>
              </span>
            </div>

            <div className="relative h-6 w-full rounded-lg bg-[var(--unit-surface)]/80 overflow-hidden p-0.5 shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${widthPercentage}%` }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
                className={`h-full rounded-md bg-gradient-to-r ${config.color} shadow-sm flex items-center justify-end pr-2`}
              >
                {widthPercentage > 20 && (
                  <span className="text-[10px] font-semibold text-white/90 drop-shadow">
                    {conversionRate}%
                  </span>
                )}
              </motion.div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
