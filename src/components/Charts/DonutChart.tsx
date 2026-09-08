'use client';

import React, { useState } from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Sector,
} from 'recharts';
import { ChartTooltip } from './ChartTooltip';

export interface DonutChartDatum {
  name: string;
  value: number;
  color: string;
  [key: string]: any;
}

export interface DonutChartProps {
  data: DonutChartDatum[];
  height?: number;
  centerTitle?: string;
  centerSubtitle?: string;
  showLegend?: boolean;
  currencyFormat?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  onSliceClick?: (entry: DonutChartDatum, index: number) => void;
}

const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="transition-all duration-300 drop-shadow-md"
      />
    </g>
  );
};

export function DonutChart({
  data,
  height = 300,
  centerTitle,
  centerSubtitle,
  showLegend = true,
  currencyFormat = false,
  innerRadius = 65,
  outerRadius = 95,
  onSliceClick,
}: DonutChartProps): JSX.Element {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

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
          No hay valores suficientes para calcular la participación.
        </p>
      </div>
    );
  }

  const totalValue = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  const displayCenterTitle =
    centerTitle !== undefined
      ? centerTitle
      : currencyFormat
        ? `S/ ${totalValue.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
        : totalValue.toLocaleString('es-PE');

  const displayCenterSubtitle = centerSubtitle || 'Total';

  return (
    <div className="relative w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="46%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={3}
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(undefined)}
            animationDuration={800}
            cursor={onSliceClick ? 'pointer' : undefined}
            onClick={
              onSliceClick
                ? (_: unknown, index: number) => onSliceClick(data[index], index)
                : undefined
            }
          >
            {data.map((entry, idx) => (
              <Cell
                key={`donut-cell-${idx}`}
                fill={entry.color}
                stroke="transparent"
              />
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

      {/* Central Metric */}
      <div className="pointer-events-none absolute inset-0 mb-6 flex flex-col items-center justify-center">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--unit-text-muted)] dark:text-[var(--unit-text-muted)]">
          {displayCenterSubtitle}
        </span>
        <span className="text-lg font-bold text-[var(--unit-text)] tracking-tight">
          {displayCenterTitle}
        </span>
      </div>
    </div>
  );
}
