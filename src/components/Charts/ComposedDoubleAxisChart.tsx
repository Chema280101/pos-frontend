'use client';

import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChartTooltip } from './ChartTooltip';

export interface ComposedDoubleAxisDatum {
  name: string;
  [key: string]: any;
}

export interface ComposedDoubleAxisChartProps {
  data: ComposedDoubleAxisDatum[];
  barKey: string;
  barLabel: string;
  barColor?: string;
  lineKey: string;
  lineLabel: string;
  lineColor?: string;
  height?: number;
  barUnitSuffix?: string;
  lineIsCurrency?: boolean;
}

export function ComposedDoubleAxisChart({
  data,
  barKey,
  barLabel,
  barColor = '#8b5cf6',
  lineKey,
  lineLabel,
  lineColor = '#f59e0b',
  height = 300,
  barUnitSuffix = 'servicios',
  lineIsCurrency = true,
}: ComposedDoubleAxisChartProps): JSX.Element {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[280px] w-full text-center p-6 rounded-unit border border-dashed border-[var(--unit-border)]/60">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--unit-surface)] mb-3 text-[var(--unit-text-muted)]">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h4 className="text-sm font-semibold text-[var(--unit-text)]">Sin datos de productividad</h4>
        <p className="text-xs text-[var(--unit-text-muted)] max-w-xs mt-1">
          No se registran actividades para el personal en este período.
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={data}
        margin={{ top: 12, right: 12, left: -10, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="currentColor"
          className="text-[var(--unit-border)]"
          opacity={0.6}
        />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: 'currentColor' }}
          className="text-[var(--unit-text-muted)] font-medium"
          tickLine={false}
          axisLine={false}
          dy={6}
        />
        {/* Left Axis: Volume / Count */}
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 11, fill: 'currentColor' }}
          className="text-purple-600 dark:text-purple-400 font-medium"
          tickLine={false}
          axisLine={false}
          label={{
            value: barLabel,
            angle: -90,
            position: 'insideLeft',
            style: { textAnchor: 'middle', fontSize: 10, fill: barColor },
          }}
        />
        {/* Right Axis: Financial / Average Ticket */}
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 11, fill: 'currentColor' }}
          className="text-amber-600 dark:text-amber-400 font-medium"
          tickLine={false}
          axisLine={false}
          tickFormatter={(val: number) => lineIsCurrency ? `S/ ${val}` : `${val}`}
          label={{
            value: lineLabel,
            angle: 90,
            position: 'insideRight',
            style: { textAnchor: 'middle', fontSize: 10, fill: lineColor },
          }}
        />
        <Tooltip
          content={
            <ChartTooltip
              currencyKey={lineIsCurrency ? [lineKey] : []}
              unitSuffix={barUnitSuffix}
            />
          }
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
          formatter={(value) => (
            <span className="text-[var(--unit-text-muted)] text-xs font-medium ml-1">
              {value}
            </span>
          )}
        />
        <Bar
          yAxisId="left"
          dataKey={barKey}
          name={barLabel}
          fill={barColor}
          radius={[6, 6, 0, 0]}
          maxBarSize={45}
          animationDuration={800}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey={lineKey}
          name={lineLabel}
          stroke={lineColor}
          strokeWidth={3}
          dot={{ r: 4, fill: lineColor, strokeWidth: 2, stroke: '#ffffff' }}
          activeDot={{ r: 6, fill: lineColor, strokeWidth: 3, stroke: '#ffffff' }}
          animationDuration={1000}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
