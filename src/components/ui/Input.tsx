'use client';

import { forwardRef, useId, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string;
  error?: string;
  hint?: string;
  showPasswordToggle?: boolean;
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
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={id}
            className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[var(--unit-text-muted)]"
          >
            {label}
            {props.required && <span className="text-red-500" aria-hidden> *</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={showPasswordToggle && isPassword ? type : initialType}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
            className={cn(
              'w-full rounded-[var(--unit-radius-sm)] border bg-[var(--unit-surface)] px-4 py-3 text-[var(--unit-text-muted)] transition-all placeholder:text-[var(--unit-text-muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] disabled:opacity-50',
              error ? 'border-red-500' : 'border-[var(--unit-border)]',
              showPasswordToggle && isPassword ? 'pr-10' : undefined,
              inputClassName
            )}
            {...props}
          />
          {showPasswordToggle && isPassword && (
            <button
              type="button"
              onClick={() => setType((t) => (t === 'password' ? 'text' : 'password'))}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-[var(--unit-radius-sm)] p-1.5 text-[var(--unit-text-muted)] transition-colors hover:bg-[var(--unit-accent)]/15 hover:text-[var(--unit-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]"
              aria-label={type === 'password' ? 'Mostrar contraseña' : 'Ocultar contraseña'}
            >
              {type === 'password' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          )}
        </div>
        {error && (
          <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-red-500" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-[var(--unit-text-muted)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
