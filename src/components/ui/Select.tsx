import React from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{
    value: string | number;
    label: string;
    disabled?: boolean;
  }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, id, ...props }, ref) => {
    const selectId = id || `select-${React.useId()}`;

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={selectId}
            className="block text-sm font-bold text-[var(--unit-text)]"
          >
            {label}
            {props.required && <span className="text-red-500" aria-hidden> *</span>}
          </label>
        )}
        
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              // Base styles
              "w-full appearance-none cursor-pointer",
              // Layout
              "rounded-xl border-2 px-4 py-3 text-sm",
              // Colors
              "border-[var(--unit-border)]/50 bg-[var(--unit-surface)] text-[var(--unit-text)]",
              // Focus states
              "focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)]",
              // Transitions
              "transition-all duration-200",
              // Error state
              error && "border-[var(--unit-error)]/50 focus:ring-[var(--unit-error)]/50 focus:border-[var(--unit-error)]",
              // Custom
              className
            )}
            {...props}
          >
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
                className="text-[var(--unit-text)] bg-[var(--unit-surface)]"
              >
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Custom dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg 
              className="h-5 w-5 text-[var(--unit-text-muted)]" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 9l-7 7-7-7" 
              />
            </svg>
          </div>
        </div>
        
        {error && (
          <p className="text-sm text-[var(--unit-error)] flex items-center gap-1">
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p className="text-sm text-[var(--unit-text-muted)]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
