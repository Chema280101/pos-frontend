'use client';

import React from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ChartTooltip } from './ChartTooltip';

export interface AreaChartDatum {
  name: string;
  [key: string]: string | number;
}

export interface AreaChartSeries {
  dataKey: string;
  color: string;
  label?: string;
  gradientFrom?: string;
  gradientTo?: string;
}

export interface AreaChartProps {
  data: AreaChartDatum[];
  series: AreaChartSeries[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  currencyKey?: string | string[];
  unitSuffix?: string;
  onPointClick?: (entry: AreaChartDatum, index: number) => void;
}

export function AreaChart({
  data,
  series,
  height = 300,
  showGrid = true,
  showLegend = true,
  currencyKey = ['ventas', 'total', 'revenue', 'ingresos', 'income', 'monto'],
  unitSuffix,
  onPointClick,
}: AreaChartProps): JSX.Element {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[280px] w-full text-center p-6 rounded-unit border border-dashed border-[var(--unit-border)]/60">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--unit-surface)] mb-3 text-[var(--unit-text-muted)]">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <h4 className="text-sm font-semibold text-[var(--unit-text)]">Sin datos registrados</h4>
        <p className="text-xs text-[var(--unit-text-muted)] max-w-xs mt-1">
          No se encontraron datos en el período seleccionado.
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
        <defs>
          {series.map((s, idx) => {
            const gradId = `areaGrad-${s.dataKey}-${idx}`;
            const fromColor = s.gradientFrom || s.color;
            const toColor = s.gradientTo || s.color;
            return (
              <linearGradient key={gradId} id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={fromColor} stopOpacity={0.45} />
                <stop offset="95%" stopColor={toColor} stopOpacity={0.02} />
              </linearGradient>
            );
          })}
        </defs>
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
            formatter={(value) => <span className="text-[var(--unit-text-muted)] text-xs font-medium ml-1">{value}</span>}
          />
        )}
        {series.map((s, idx) => {
          const gradId = `areaGrad-${s.dataKey}-${idx}`;
          return (
            <Area
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              name={s.label ?? s.dataKey}
              stroke={s.color}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#${gradId})`}
              activeDot={{
                r: 6,
                stroke: s.color,
                strokeWidth: 3,
                fill: '#ffffff',
                className: 'drop-shadow-md',
              }}
              animationDuration={800}
              cursor={onPointClick ? 'pointer' : undefined}
              onClick={
                onPointClick
                  ? (props: any) => onPointClick(props?.payload ?? props, props?.index ?? 0)
                  : undefined
              }
            />
          );
        })}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
