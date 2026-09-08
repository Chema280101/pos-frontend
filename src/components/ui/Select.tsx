import React from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: Array<{
    value: string | number;
    label: string;
    disabled?: boolean;
  }>;
  children?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, children, id, ...props }, ref) => {
    const selectId = id || `select-${React.useId()}`;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label 
            htmlFor={selectId}
            className="block text-[11px] font-bold uppercase tracking-wider text-[var(--unit-text-muted)]"
          >
            {label}
            {props.required && <span className="text-[var(--unit-accent)] ml-0.5" aria-hidden> *</span>}
          </label>
        )}
        
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
            className={cn(
              "w-full appearance-none cursor-pointer rounded-unit border px-4 py-2.5 pr-10 text-sm font-medium",
              "bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] focus:bg-[var(--unit-surface)] text-[var(--unit-text)]",
              "transition-all duration-200 outline-none",
              "focus:ring-2 focus:ring-[var(--unit-accent)]/40 focus:border-[var(--unit-accent)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error 
                ? "border-red-500/50 focus:ring-red-500/30 focus:border-red-500 bg-red-500/5" 
                : "border-[var(--unit-border)]/60 hover:border-[var(--unit-border)]",
              className
            )}
            {...props}
          >
            {options 
              ? options.map((option) => (
                  <option 
                    key={option.value} 
                    value={option.value}
                    disabled={option.disabled}
                    className="text-[var(--unit-text)] bg-[var(--unit-surface)] py-1"
                  >
                    {option.label}
                  </option>
                ))
              : children}
          </select>
          
          {/* Custom dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-[var(--unit-text-muted)]">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        
        {error && (
          <p id={`${selectId}-error`} className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1" role="alert">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p id={`${selectId}-helper`} className="text-xs text-[var(--unit-text-muted)] mt-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
