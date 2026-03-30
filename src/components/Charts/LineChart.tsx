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

// Custom Spanish tooltip formatter
const SpanishTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-800 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? `S/ ${entry.value.toFixed(2)}` : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

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
  // Empty state check
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] w-full text-center p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
        <Tooltip content={<SpanishTooltip />} />
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
