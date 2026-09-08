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
      'relative overflow-hidden rounded-unit border border-[var(--unit-border)]/50 bg-[var(--unit-surface)] p-6 shadow-unit-sm hover:shadow-unit transition-all duration-300 group',
      className
    )}>
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-unit bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] border border-[var(--unit-accent)]/20 shadow-unit-sm group-hover:scale-105 transition-transform">
            <Icon className="h-6 w-6" />
          </div>
          <span className="text-xs font-bold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] px-3 py-1 rounded-full border border-[var(--unit-border)]/50 shadow-unit-sm">
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
