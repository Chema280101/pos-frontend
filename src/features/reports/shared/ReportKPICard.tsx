import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ReportKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function ReportKPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
}: ReportKPICardProps): JSX.Element {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group',
      className
    )}>
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30 shadow-lg group-hover:scale-110 transition-transform">
            <Icon className="h-6 w-6 text-[var(--unit-accent)]" />
          </div>
          <span className="text-xs font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-full border border-[var(--unit-border)] shadow-sm">
            {title}
          </span>
        </div>
        
        <div className="space-y-2">
          <p className="text-3xl font-bold text-[var(--unit-text)] tabular-nums">{value}</p>
          {subtitle && (
            <p className="text-sm text-[var(--unit-text-muted)] font-medium">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 text-xs font-bold mt-2 px-2 py-1 rounded-full border',
              trend.isPositive 
                ? 'text-emerald-700 bg-emerald-100 border-emerald-200' 
                : 'text-red-700 bg-red-100 border-red-200'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{trend.value}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
