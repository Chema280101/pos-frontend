'use client';

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// Custom Spanish tooltip formatter
const SpanishTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
    const percentage = ((data.value / total) * 100).toFixed(1);
    
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-800 mb-1">{data.name}</p>
        <p className="text-sm text-gray-600">
          Valor: {typeof data.value === 'number' ? `S/ ${data.value.toFixed(2)}` : data.value}
        </p>
        <p className="text-sm text-gray-500">{percentage}% del total</p>
      </div>
    );
  }
  return null;
};

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
  // Empty state check
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] w-full text-center p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin datos para este período</h3>
        <p className="text-sm text-gray-500 max-w-md">
          No hay información disponible para mostrar en la gráfica. Intenta ajustar los filtros o seleccionar un período diferente.
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
        <Tooltip content={<SpanishTooltip />} />
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
