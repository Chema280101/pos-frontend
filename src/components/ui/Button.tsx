
'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'border-2 border-[var(--unit-accent)]/50 bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white shadow-lg shadow-[var(--unit-accent)]/25 hover:shadow-xl hover:shadow-[var(--unit-accent)]/30',
  secondary: 'border-2 border-[var(--unit-primary)]/50 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] text-[var(--unit-text)] shadow-md hover:shadow-lg',
  ghost: 'border-2 border-transparent bg-transparent text-[var(--unit-text)] hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-accent)]/10',
  danger: 'border-2 border-red-500/50 bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30',
  outline: 'border-2 border-[var(--unit-accent)]/50 bg-transparent text-[var(--unit-accent)] hover:bg-gradient-to-r hover:from-[var(--unit-accent)]/10 hover:to-[var(--unit-primary)]/10',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm rounded-xl font-semibold',
  md: 'px-6 py-3 text-base rounded-xl font-bold',
  lg: 'px-8 py-4 text-lg rounded-xl font-bold',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
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
          'inline-flex items-center justify-center font-bold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--unit-accent)]/50 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden',
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
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
        
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
          <span className="relative z-10">{children}</span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
