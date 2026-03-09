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
  color?: 'green' | 'blue' | 'purple' | 'amber' | 'red' | 'primary';
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
    border: 'border-green-500/30',
    bg: 'from-green-50 to-green-100',
    icon: 'from-green-600 to-green-700',
    text: 'text-green-900',
    muted: 'text-green-700',
    badge: 'text-green-800 bg-white border-green-300'
  },
  blue: {
    border: 'border-blue-500/30',
    bg: 'from-blue-50 to-blue-100',
    icon: 'from-blue-600 to-blue-700',
    text: 'text-blue-900',
    muted: 'text-blue-700',
    badge: 'text-blue-800 bg-white border-blue-300'
  },
  purple: {
    border: 'border-purple-500/30',
    bg: 'from-purple-50 to-purple-100',
    icon: 'from-purple-600 to-purple-700',
    text: 'text-purple-900',
    muted: 'text-purple-700',
    badge: 'text-purple-800 bg-white border-purple-300'
  },
  amber: {
    border: 'border-amber-500/30',
    bg: 'from-amber-50 to-amber-100',
    icon: 'from-amber-600 to-amber-700',
    text: 'text-amber-900',
    muted: 'text-amber-700',
    badge: 'text-amber-800 bg-white border-amber-300'
  },
  red: {
    border: 'border-red-500/30',
    bg: 'from-red-50 to-red-100',
    icon: 'from-red-600 to-red-700',
    text: 'text-red-900',
    muted: 'text-red-700',
    badge: 'text-red-800 bg-white border-red-300'
  },
  primary: {
    border: 'border-[var(--unit-primary)]/30',
    bg: 'from-[var(--unit-surface)] to-[var(--unit-surface-elevated)]',
    icon: 'from-[var(--unit-primary)]/90 to-[var(--unit-accent)]/90',
    text: 'text-[var(--unit-text)]',
    muted: 'text-[var(--unit-text-muted)]',
    badge: 'text-[var(--unit-text)] bg-[var(--unit-surface)] border-[var(--unit-border)]'
  }
};

export function KPICard({
  title,
  value,
  subtitle,
  description,
  href,
  critical,
  className,
  icon,
  color = 'primary',
  unit
}: KPICardProps): JSX.Element {
  const useAnimation = typeof value === 'number' && Number.isFinite(value);
  const colors = critical ? colorConfig.red : colorConfig[color];

  const defaultIcon = critical ? (
    <AlertTriangle className="h-6 w-6 text-white" />
  ) : (
    <TrendingUp className="h-6 w-6 text-white" />
  );

  const content = (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-xl border-2 bg-gradient-to-br p-6 hover:shadow-lg transition-all duration-300 group',
        colors.border,
        colors.bg,
        href && 'cursor-pointer',
        className
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={href ? { scale: 1.02 } : { y: -2 }}
      whileTap={href ? { scale: 0.98 } : undefined}
    >
      {/* Hover overlay - exact same as ClientsPage */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>

      <div className="relative">
        {/* Icon + Badge - exact same structure as ClientsPage */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br border-2 shadow-lg group-hover:scale-110 transition-transform">
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
