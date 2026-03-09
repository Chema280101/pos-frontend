'use client';

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export interface LineChartDatum {
  name: string;
  [key: string]: string | number;
}

export interface LineChartSeries {
  dataKey: string;
  color: string;
  label?: string;
  dashed?: boolean;
}

export interface LineChartProps {
  data: LineChartDatum[];
  series: LineChartSeries[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  onDotClick?: (entry: LineChartDatum, index: number) => void;
}

export function LineChart({
  data,
  series,
  height = 300,
  showGrid = true,
  showLegend = true,
  onDotClick,
}: LineChartProps): JSX.Element {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart
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
          <Line
            key={s.dataKey}
            type="monotone"
            dataKey={s.dataKey}
            name={s.label ?? s.dataKey}
            stroke={s.color}
            strokeWidth={2}
            strokeDasharray={s.dashed ? '5 5' : undefined}
            dot={{ r: 3, strokeWidth: 2 }}
            activeDot={{ r: 5 }}
            animationDuration={600}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
