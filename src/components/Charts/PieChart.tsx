'use client';

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

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
  onSliceClick?: (entry: PieChartDatum, index: number) => void;
}

export function PieChart({
  data,
  height = 300,
  showLegend = true,
  innerRadius = 0,
  outerRadius = 100,
  onSliceClick,
}: PieChartProps): JSX.Element {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          animationDuration={600}
          cursor={onSliceClick ? 'pointer' : undefined}
          onClick={
            onSliceClick
              ? (_: unknown, index: number) => onSliceClick(data[index], index)
              : undefined
          }
        >
          {data.map((entry, idx) => (
            <Cell key={`cell-${idx}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: 'var(--unit-border-radius)',
            border: '1px solid var(--unit-border)',
            background: 'var(--unit-surface-elevated)',
            color: 'var(--unit-text)',
            fontSize: 13,
          }}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value: string) => (
              <span style={{ color: 'var(--unit-text)' }}>{value}</span>
            )}
          />
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
