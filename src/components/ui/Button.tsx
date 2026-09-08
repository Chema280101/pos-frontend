
'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'success' | 'warning';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'border-2 border-[var(--unit-accent)]/50 bg-[var(--unit-accent)] text-white shadow-unit shadow-[var(--unit-accent)]/25 hover:shadow-unit-lg hover:shadow-[var(--unit-accent)]/30 hover:bg-[var(--unit-accent-hover)] focus:ring-[var(--unit-accent)]/50',
  secondary: 'border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface-elevated)] text-[var(--unit-text)] shadow-unit hover:shadow-unit-lg hover:bg-[var(--unit-accent)]/5 focus:ring-[var(--unit-primary)]/50',
  ghost: 'border-2 border-transparent bg-transparent text-[var(--unit-text)] hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-accent)]/10 focus:ring-[var(--unit-accent)]/50',
  danger: 'border-2 border-[var(--unit-error)]/50 bg-[var(--unit-error)] text-white shadow-unit shadow-[var(--unit-error)]/25 hover:shadow-unit-lg hover:shadow-[var(--unit-error)]/30 hover:bg-red-700 focus:ring-[var(--unit-error)]/50',
  outline: 'border-2 border-[var(--unit-accent)]/50 bg-transparent text-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/10 focus:ring-[var(--unit-accent)]/50',
  success: 'border-2 border-[var(--unit-success)]/50 bg-[var(--unit-success)] text-white shadow-unit shadow-[var(--unit-success)]/25 hover:shadow-unit-lg hover:shadow-[var(--unit-success)]/30 hover:bg-green-700 focus:ring-[var(--unit-success)]/50',
  warning: 'border-2 border-[var(--unit-warning)]/50 bg-[var(--unit-warning)] text-white shadow-unit shadow-[var(--unit-warning)]/25 hover:shadow-unit-lg hover:shadow-[var(--unit-warning)]/30 hover:bg-amber-700 focus:ring-[var(--unit-warning)]/50',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-xs rounded-[calc(var(--unit-border-radius)*0.5)] font-semibold',
  sm: 'px-3 py-1.5 text-sm rounded-[calc(var(--unit-border-radius)*0.5)] font-semibold',
  md: 'px-4 py-2 text-sm rounded-unit font-bold',
  lg: 'px-6 py-3 text-base rounded-unit font-bold',
  xl: 'px-8 py-4 text-lg rounded-unit-lg font-bold',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      onDrag,
      onDragStart,
      onDragEnd,
      onAnimationStart,
      onAnimationEnd,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        type="button"
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-bold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--unit-accent)]/50 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none relative overflow-hidden',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        whileHover={{ 
          scale: disabled || isLoading ? 1 : 1.05,
          boxShadow: disabled || isLoading ? 'none' : '0 10px 25px -5px rgba(0, 0, 0, 0.2)'
        }}
        whileTap={{ 
          scale: disabled || isLoading ? 1 : 0.95 
        }}
        {...(props as Omit<ButtonProps, 'className' | 'variant' | 'size' | 'isLoading' | 'fullWidth' | 'disabled' | 'children' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'>)}
      >
        
        {isLoading ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin relative z-10"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="relative z-10">Cargando...</span>
          </>
        ) : (
          <span className="relative z-10 flex items-center gap-2">
            {leftIcon && !isLoading && leftIcon}
            {children}
            {rightIcon && !isLoading && rightIcon}
          </span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
