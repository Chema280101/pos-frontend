import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  showCount?: boolean;
  maxLength?: number;
  containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      showCount = false,
      maxLength,
      value,
      defaultValue,
      className,
      containerClassName,
      id: idProp,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const id = idProp ?? `textarea-${generatedId.replace(/:/g, '')}`;
    
    // Count characters if needed
    const currentLength = typeof value === 'string' 
      ? value.length 
      : typeof defaultValue === 'string' 
      ? defaultValue.length 
      : 0;

    return (
      <div className={cn('w-full space-y-1.5', containerClassName)}>
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={id}
              className="block text-[11px] font-bold uppercase tracking-wider text-[var(--unit-text-muted)]"
            >
              {label}
              {props.required && <span className="text-[var(--unit-accent)] ml-0.5" aria-hidden> *</span>}
            </label>
          )}
          {showCount && maxLength && (
            <span className="text-[11px] font-medium text-[var(--unit-text-muted)]">
              {currentLength}/{maxLength}
            </span>
          )}
        </div>

        <textarea
          ref={ref}
          id={id}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(
            'w-full rounded-unit border px-4 py-2.5 text-sm font-medium',
            'bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] focus:bg-[var(--unit-surface)] text-[var(--unit-text)] placeholder:text-[var(--unit-text-muted)]/60',
            'transition-all duration-200 outline-none resize-y min-h-[90px]',
            'focus:ring-2 focus:ring-[var(--unit-accent)]/40 focus:border-[var(--unit-accent)]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500 bg-red-500/5'
              : 'border-[var(--unit-border)]/60 hover:border-[var(--unit-border)]',
            className
          )}
          {...props}
        />

        {error && (
          <p id={`${id}-error`} className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1" role="alert">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${id}-hint`} className="text-xs text-[var(--unit-text-muted)] mt-1">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
