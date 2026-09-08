'use client';

import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ChartTooltip } from './ChartTooltip';

export interface BarChartDatum {
  name: string;
  [key: string]: string | number;
}

export interface BarChartSeries {
  dataKey: string;
  color: string;
  label?: string;
  radius?: [number, number, number, number];
}

export interface BarChartProps {
  data: BarChartDatum[];
  series: BarChartSeries[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  currencyKey?: string | string[];
  unitSuffix?: string;
  onBarClick?: (entry: BarChartDatum, index: number) => void;
}

export function BarChart({
  data,
  series,
  height = 300,
  showGrid = true,
  showLegend = true,
  currencyKey = ['ventas', 'total', 'revenue', 'ingresos', 'income', 'expenses', 'ticketPromedio'],
  unitSuffix,
  onBarClick,
}: BarChartProps): JSX.Element {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[280px] w-full text-center p-6 rounded-unit border border-dashed border-[var(--unit-border)]/60">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--unit-surface)] mb-3 text-[var(--unit-text-muted)]">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h4 className="text-sm font-semibold text-[var(--unit-text)]">Sin datos registrados</h4>
        <p className="text-xs text-[var(--unit-text-muted)] max-w-xs mt-1">
          No hay información disponible para este período.
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        margin={{ top: 12, right: 16, left: -10, bottom: 0 }}
      >
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="currentColor"
            className="text-[var(--unit-border)]"
            opacity={0.6}
          />
        )}
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: 'currentColor' }}
          className="text-[var(--unit-text-muted)] font-medium"
          tickLine={false}
          axisLine={false}
          dy={6}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'currentColor' }}
          className="text-[var(--unit-text-muted)] font-medium"
          tickLine={false}
          axisLine={false}
          tickFormatter={(val: number) => {
            if (val >= 1000) return `S/ ${(val / 1000).toFixed(1)}k`;
            return `${val}`;
          }}
        />
        <Tooltip
          content={
            <ChartTooltip
              currencyKey={currencyKey}
              unitSuffix={unitSuffix}
            />
          }
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
            iconType="circle"
            formatter={(value) => (
              <span className="text-[var(--unit-text-muted)] text-xs font-medium ml-1">
                {value}
              </span>
            )}
          />
        )}
        {series.map((s) => (
          <Bar
            key={s.dataKey}
            dataKey={s.dataKey}
            name={s.label ?? s.dataKey}
            fill={s.color}
            radius={s.radius ?? [6, 6, 0, 0]}
            maxBarSize={45}
            animationDuration={800}
            cursor={onBarClick ? 'pointer' : undefined}
            onClick={
              onBarClick
                ? (_: unknown, index: number) => onBarClick(data[index], index)
                : undefined
            }
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
