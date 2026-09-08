'use client';

import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'prefix'> {
  label?: string;
  error?: string;
  hint?: string;
  showPasswordToggle?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  prefixText?: string;
  containerClassName?: string;
  inputClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      showPasswordToggle = false,
      leftIcon,
      rightIcon,
      prefixText,
      type: initialType = 'text',
      containerClassName,
      inputClassName,
      id: idProp,
      ...props
    },
    ref
  ) => {
    const [type, setType] = useState(initialType);
    const generatedId = useId();
    const id = idProp ?? generatedId.replace(/:/g, '');
    const isPassword = initialType === 'password';

    return (
      <div className={cn('w-full space-y-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={id}
            className="block text-[11px] font-bold uppercase tracking-wider text-[var(--unit-text-muted)]"
          >
            {label}
            {props.required && <span className="text-[var(--unit-accent)] ml-0.5" aria-hidden> *</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-[var(--unit-text-muted)]">
              {leftIcon}
            </div>
          )}
          {prefixText && !leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-sm font-semibold text-[var(--unit-text-muted)]">
              {prefixText}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            type={showPasswordToggle && isPassword ? type : initialType}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
            className={cn(
              'w-full rounded-unit border px-4 py-2.5 text-sm font-medium',
              'bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] focus:bg-[var(--unit-surface)] text-[var(--unit-text)] placeholder:text-[var(--unit-text-muted)]/60',
              'transition-all duration-200 outline-none',
              'focus:ring-2 focus:ring-[var(--unit-accent)]/40 focus:border-[var(--unit-accent)]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error
                ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500 bg-red-500/5'
                : 'border-[var(--unit-border)]/60 hover:border-[var(--unit-border)]',
              (leftIcon || prefixText) && (prefixText ? 'pl-10' : 'pl-11'),
              (showPasswordToggle && isPassword) || rightIcon ? 'pr-11' : undefined,
              inputClassName
            )}
            {...props}
          />
          {rightIcon && !showPasswordToggle && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-[var(--unit-text-muted)]">
              {rightIcon}
            </div>
          )}
          {showPasswordToggle && isPassword && (
            <button
              type="button"
              onClick={() => setType((t) => (t === 'password' ? 'text' : 'password'))}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--unit-text-muted)] hover:text-[var(--unit-text)] transition-colors hover:bg-[var(--unit-surface-elevated)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/40"
              aria-label={type === 'password' ? 'Mostrar contraseña' : 'Ocultar contraseña'}
            >
              {type === 'password' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          )}
        </div>
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

Input.displayName = 'Input';
