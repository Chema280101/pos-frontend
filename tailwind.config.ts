import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx}',
    './src/hooks/**/*.{js,ts,jsx,tsx}',
    './src/guards/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['var(--unit-font-heading)', 'serif'],
        body: ['var(--unit-font-body)', 'sans-serif'],
      },
      colors: {
        'unit-primary': 'var(--unit-primary)',
        'unit-primary-dark': 'var(--unit-primary-dark)',
        'unit-secondary': 'var(--unit-secondary)',
        'unit-accent': 'var(--unit-accent)',
        'unit-accent-hover': 'var(--unit-accent-hover)',
        'unit-text': 'var(--unit-text)',
        'unit-text-muted': 'var(--unit-text-muted)',
        'unit-surface': 'var(--unit-surface)',
        'unit-surface-elevated': 'var(--unit-surface-elevated)',
        'unit-border': 'var(--unit-border)',
        'unit-error': 'var(--unit-error)',
        'unit-warning': 'var(--unit-warning)',
        'unit-success': 'var(--unit-success)',
        'unit-info': 'var(--unit-info)',
      },
      borderRadius: {
        unit: 'var(--unit-border-radius)',
        'unit-sm': 'var(--unit-radius-sm)',
        'unit-lg': 'calc(var(--unit-border-radius) + 4px)',
        'unit-xl': 'calc(var(--unit-border-radius) + 8px)',
      },
      boxShadow: {
        unit: 'var(--unit-shadow)',
        'unit-lg': 'var(--unit-shadow-lg)',
        'unit-glow': '0 0 20px -5px var(--unit-accent)',
        'card-soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
        'card-hover': '0 12px 30px -4px rgba(0, 0, 0, 0.1), 0 4px 10px -2px rgba(0, 0, 0, 0.04)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        'fade-in': 'fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
