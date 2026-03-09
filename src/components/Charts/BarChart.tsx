'use client';

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

export interface BarChartDatum {
  name: string;
  [key: string]: string | number;
}

export interface BarChartSeries {
  dataKey: string;
  color: string;
  label?: string;
}

export interface BarChartProps {
  data: BarChartDatum[];
  series: BarChartSeries[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  onBarClick?: (entry: BarChartDatum, index: number) => void;
}

export function BarChart({
  data,
  series,
  height = 300,
  showGrid = true,
  showLegend = true,
  onBarClick,
}: BarChartProps): JSX.Element {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            borderRadius: 'var(--unit-border-radius)',
            border: '1px solid var(--unit-border)',
            background: 'var(--unit-surface-elevated)',
            color: 'var(--unit-text)',
            fontSize: 13,
          }}
        />
        {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s) => (
          <Bar
            key={s.dataKey}
            dataKey={s.dataKey}
            name={s.label ?? s.dataKey}
            fill={s.color}
            radius={[4, 4, 0, 0]}
            animationDuration={600}
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
