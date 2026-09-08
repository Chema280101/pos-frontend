'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string | undefined;
  icon?: any;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps): JSX.Element {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && (
            <ChevronRight className="h-4 w-4 text-[var(--unit-text-muted)]/50" aria-hidden />
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="flex items-center gap-2 px-3 py-1.5 rounded-unit border border-[var(--unit-border)]/30 bg-[var(--unit-surface-elevated)] hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10 transition-all duration-200 group"
            >
              {item.icon && (
                <item.icon className="h-4 w-4 text-[var(--unit-text-muted)] group-hover:text-[var(--unit-accent)] transition-colors" />
              )}
              <span className="font-medium text-[var(--unit-text)]/80 group-hover:text-[var(--unit-accent)] transition-colors">
                {item.label}
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-unit border-2 border-[var(--unit-accent)]/30 bg-[var(--unit-accent)]/10">
              {item.icon && (
                <item.icon className="h-4 w-4 text-[var(--unit-accent)]" />
              )}
              <span className="font-bold text-[var(--unit-text)]">{item.label}</span>
            </div>
          )}
        </span>
      ))}
    </nav>
  );
}
