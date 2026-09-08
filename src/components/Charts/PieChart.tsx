'use client';

import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ChartTooltip } from './ChartTooltip';

export interface PieChartDatum {
  name: string;
  value: number;
  color: string;
}

export interface PieChartProps {
  data: PieChartDatum[];
  height?: number;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  currencyFormat?: boolean;
  onSliceClick?: (entry: PieChartDatum, index: number) => void;
}

export function PieChart({
  data,
  height = 300,
  showLegend = true,
  innerRadius = 0,
  outerRadius = 90,
  currencyFormat = false,
  onSliceClick,
}: PieChartProps): JSX.Element {
  if (!data || data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-[280px] w-full text-center p-6 rounded-unit border border-dashed border-[var(--unit-border)]/60">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--unit-surface)] mb-3 text-[var(--unit-text-muted)]">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          </svg>
        </div>
        <h4 className="text-sm font-semibold text-[var(--unit-text)]">Sin datos de distribución</h4>
        <p className="text-xs text-[var(--unit-text-muted)] max-w-xs mt-1">
          No hay suficiente información para representar la distribución.
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="48%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          animationDuration={800}
          cursor={onSliceClick ? 'pointer' : undefined}
          onClick={
            onSliceClick
              ? (_: unknown, index: number) => onSliceClick(data[index], index)
              : undefined
          }
        >
          {data.map((entry, idx) => (
            <Cell key={`cell-${idx}`} fill={entry.color} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          content={
            <ChartTooltip
              currencyKey={currencyFormat ? ['value'] : []}
              showPercentage={true}
            />
          }
        />
        {showLegend && (
          <Legend
            verticalAlign="bottom"
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            iconType="circle"
            formatter={(value: string) => (
              <span className="text-[var(--unit-text-muted)] text-xs font-medium ml-1">
                {value}
              </span>
            )}
          />
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
