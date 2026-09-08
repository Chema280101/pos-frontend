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
  Cell,
  LabelList,
} from 'recharts';
import { ChartTooltip } from './ChartTooltip';

export interface HorizontalBarChartDatum {
  name: string;
  value: number;
  secondaryValue?: number;
  category?: string;
  [key: string]: any;
}

export interface HorizontalBarChartProps {
  data: HorizontalBarChartDatum[];
  valueKey?: string;
  labelKey?: string;
  color?: string;
  colors?: string[];
  height?: number;
  currencyFormat?: boolean;
  unitSuffix?: string;
  showRanking?: boolean;
  onBarClick?: (entry: HorizontalBarChartDatum, index: number) => void;
}

const DEFAULT_PALETTE = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#6366f1',
];

export function HorizontalBarChart({
  data,
  valueKey = 'value',
  labelKey = 'name',
  color = '#3b82f6',
  colors = DEFAULT_PALETTE,
  height,
  currencyFormat = false,
  unitSuffix,
  showRanking = true,
  onBarClick,
}: HorizontalBarChartProps): JSX.Element {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[280px] w-full text-center p-6 rounded-unit border border-dashed border-[var(--unit-border)]/60">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--unit-surface)] mb-3 text-[var(--unit-text-muted)]">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </div>
        <h4 className="text-sm font-semibold text-[var(--unit-text)]">Sin datos de ranking</h4>
        <p className="text-xs text-[var(--unit-text-muted)] max-w-xs mt-1">
          No hay elementos suficientes para mostrar en esta lista.
        </p>
      </div>
    );
  }

  // Dynamic height calculation based on item count if not set
  const calculatedHeight = height || Math.max(260, data.length * 38 + 40);

  const formattedData = data.map((item, idx) => ({
    ...item,
    ranking: idx + 1,
    displayName: showRanking ? `#${idx + 1} ${item[labelKey]}` : item[labelKey],
  }));

  return (
    <ResponsiveContainer width="100%" height={calculatedHeight}>
      <RechartsBarChart
        data={formattedData}
        layout="vertical"
        margin={{ top: 8, right: 36, left: 10, bottom: 8 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          horizontal={false}
          stroke="currentColor"
          className="text-[var(--unit-border)]"
          opacity={0.5}
        />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: 'currentColor' }}
          className="text-[var(--unit-text-muted)] font-medium"
          tickLine={false}
          axisLine={false}
          tickFormatter={(val: number) => {
            if (currencyFormat) {
              if (val >= 1000) return `S/ ${(val / 1000).toFixed(1)}k`;
              return `S/ ${val}`;
            }
            return `${val}`;
          }}
        />
        <YAxis
          type="category"
          dataKey="displayName"
          tick={{ fontSize: 12, fill: 'currentColor' }}
          className="text-[var(--unit-text)] font-medium"
          tickLine={false}
          axisLine={false}
          width={130}
        />
        <Tooltip
          content={
            <ChartTooltip
              currencyKey={currencyFormat ? [valueKey] : []}
              unitSuffix={unitSuffix}
            />
          }
        />
        <Bar
          dataKey={valueKey}
          name={currencyFormat ? 'Ingresos' : 'Cantidad'}
          radius={[0, 6, 6, 0]}
          animationDuration={700}
          cursor={onBarClick ? 'pointer' : undefined}
          onClick={
            onBarClick
              ? (_: unknown, index: number) => onBarClick(data[index], index)
              : undefined
          }
        >
          {formattedData.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length] || color}
            />
          ))}
          <LabelList
            dataKey={valueKey}
            position="right"
            formatter={(val: number) =>
              currencyFormat
                ? `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                : `${val}${unitSuffix ? ` ${unitSuffix}` : ''}`
            }
            className="text-[11px] font-semibold fill-[var(--unit-text-muted)]"
          />
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
