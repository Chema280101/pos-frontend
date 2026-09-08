'use client';

import React, { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { motion, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, Package, AlertTriangle, CheckCircle, Lock, CreditCard } from 'lucide-react';

export interface KPICardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  description?: string;
  href?: string;
  critical?: boolean;
  className?: string;
  icon?: ReactNode;
  color?: 'green' | 'blue' | 'purple' | 'amber' | 'red' | 'teal' | 'indigo' | 'pink' | 'primary';
  unit?: string;
}

function AnimatedNumber({ value }: { value: number }): JSX.Element {
  const spring = useSpring(0, { stiffness: 75, damping: 25 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsub = spring.on('change', (v) => setDisplay(Math.round(v)));
    return () => unsub();
  }, [spring]);

  return <span>{display}</span>;
}

const colorConfig = {
  green: {
    border: 'border-emerald-500/30 dark:border-emerald-500/20 hover:border-emerald-500/50',
    bg: 'bg-emerald-500/[0.06] dark:bg-emerald-500/10',
    iconBg: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25',
    text: 'text-emerald-800 dark:text-emerald-200',
    muted: 'text-emerald-700/80 dark:text-emerald-300/80',
    badge: 'text-emerald-800 dark:text-emerald-200 bg-emerald-500/15 border-emerald-500/30'
  },
  blue: {
    border: 'border-blue-500/30 dark:border-blue-500/20 hover:border-blue-500/50',
    bg: 'bg-blue-500/[0.06] dark:bg-blue-500/10',
    iconBg: 'bg-blue-600 text-white shadow-md shadow-blue-600/25',
    text: 'text-blue-800 dark:text-blue-200',
    muted: 'text-blue-700/80 dark:text-blue-300/80',
    badge: 'text-blue-800 dark:text-blue-200 bg-blue-500/15 border-blue-500/30'
  },
  purple: {
    border: 'border-purple-500/30 dark:border-purple-500/20 hover:border-purple-500/50',
    bg: 'bg-purple-500/[0.06] dark:bg-purple-500/10',
    iconBg: 'bg-purple-600 text-white shadow-md shadow-purple-600/25',
    text: 'text-purple-800 dark:text-purple-200',
    muted: 'text-purple-700/80 dark:text-purple-300/80',
    badge: 'text-purple-800 dark:text-purple-200 bg-purple-500/15 border-purple-500/30'
  },
  amber: {
    border: 'border-amber-500/30 dark:border-amber-500/20 hover:border-amber-500/50',
    bg: 'bg-amber-500/[0.06] dark:bg-amber-500/10',
    iconBg: 'bg-amber-600 text-white shadow-md shadow-amber-600/25',
    text: 'text-amber-800 dark:text-amber-200',
    muted: 'text-amber-700/80 dark:text-amber-300/80',
    badge: 'text-amber-800 dark:text-amber-200 bg-amber-500/15 border-amber-500/30'
  },
  red: {
    border: 'border-rose-500/30 dark:border-rose-500/20 hover:border-rose-500/50',
    bg: 'bg-rose-500/[0.06] dark:bg-rose-500/10',
    iconBg: 'bg-rose-600 text-white shadow-md shadow-rose-600/25',
    text: 'text-rose-800 dark:text-rose-200',
    muted: 'text-rose-700/80 dark:text-rose-300/80',
    badge: 'text-rose-800 dark:text-rose-200 bg-rose-500/15 border-rose-500/30'
  },
  teal: {
    border: 'border-teal-500/30 dark:border-teal-500/20 hover:border-teal-500/50',
    bg: 'bg-teal-500/[0.06] dark:bg-teal-500/10',
    iconBg: 'bg-teal-600 text-white shadow-md shadow-teal-600/25',
    text: 'text-teal-800 dark:text-teal-200',
    muted: 'text-teal-700/80 dark:text-teal-300/80',
    badge: 'text-teal-800 dark:text-teal-200 bg-teal-500/15 border-teal-500/30'
  },
  indigo: {
    border: 'border-indigo-500/30 dark:border-indigo-500/20 hover:border-indigo-500/50',
    bg: 'bg-indigo-500/[0.06] dark:bg-indigo-500/10',
    iconBg: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25',
    text: 'text-indigo-800 dark:text-indigo-200',
    muted: 'text-indigo-700/80 dark:text-indigo-300/80',
    badge: 'text-indigo-800 dark:text-indigo-200 bg-indigo-500/15 border-indigo-500/30'
  },
  pink: {
    border: 'border-pink-500/30 dark:border-pink-500/20 hover:border-pink-500/50',
    bg: 'bg-pink-500/[0.06] dark:bg-pink-500/10',
    iconBg: 'bg-pink-600 text-white shadow-md shadow-pink-600/25',
    text: 'text-pink-800 dark:text-pink-200',
    muted: 'text-pink-700/80 dark:text-pink-300/80',
    badge: 'text-pink-800 dark:text-pink-200 bg-pink-500/15 border-pink-500/30'
  },
  primary: {
    border: 'border-[var(--unit-accent)]/30 hover:border-[var(--unit-accent)]/50',
    bg: 'bg-[var(--unit-accent)]/[0.06] dark:bg-[var(--unit-accent)]/10',
    iconBg: 'bg-[var(--unit-accent)] text-white shadow-md shadow-[var(--unit-accent)]/25',
    text: 'text-[var(--unit-text)]',
    muted: 'text-[var(--unit-text-muted)]',
    badge: 'text-[var(--unit-accent)] bg-[var(--unit-accent)]/15 border-[var(--unit-accent)]/30'
  }
};

export function KPICard({
  title,
  value,
  subtitle,
  description,
  href,
  critical = false,
  className,
  icon,
  color = 'blue',
  unit,
}: KPICardProps): JSX.Element {
  const colors = critical ? colorConfig.red : colorConfig[color];
  const isPositive = typeof value === 'number' ? value >= 0 : !value?.toString().startsWith('-');
  const useAnimation = typeof value === 'number';

  const defaultIcon = isPositive ? (
    <TrendingUp className="h-5 w-5 text-white" />
  ) : (
    <TrendingDown className="h-5 w-5 text-white" />
  );

  const content = (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-unit border p-6 shadow-unit transition-all duration-200 group backdrop-blur-sm',
        colors.border,
        colors.bg,
        href && 'cursor-pointer hover:shadow-unit-lg',
        className
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={href ? { scale: 1.02 } : { y: -2 }}
      whileTap={href ? { scale: 0.98 } : undefined}
    >
      <div className="relative">
        {/* Icon + Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className={cn(
            'flex h-11 w-11 items-center justify-center rounded-unit transition-transform group-hover:scale-105',
            colors.iconBg
          )}>
            {icon || defaultIcon}
          </div>
          <span className={cn(
            'text-xs font-bold px-3 py-1 rounded-full border shadow-sm',
            colors.badge
          )}>
            {critical ? 'Crítico' : 'Hoy'}
          </span>
        </div>

        {/* Main metric with unit */}
        <div className="mb-3">
          <p className={cn(
            'text-3xl font-bold tabular-nums',
            colors.text
          )}>
            {useAnimation ? <AnimatedNumber value={value as number} /> : value}
            {unit && <span className="text-xl font-normal ml-1">{unit}</span>}
          </p>
        </div>
        
        {/* Clear subtitle */}
        {subtitle && (
          <p className={cn(
            'text-sm font-medium mb-1',
            colors.muted
          )}>
            {subtitle}
          </p>
        )}

        {/* Additional description */}
        {description && (
          <p className="text-xs text-[var(--unit-text-muted)]">
            {description}
          </p>
        )}
      </div>
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--unit-accent)]">
        {content}
      </Link>
    );
  }
  return content;
}
