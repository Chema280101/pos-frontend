/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Colores personalizados para el tema
        primary: 'var(--unit-primary)',
        'primary-dark': 'var(--unit-primary-dark)',
        secondary: 'var(--unit-secondary)',
        accent: 'var(--unit-accent)',
        'accent-hover': 'var(--unit-accent-hover)',
        text: 'var(--unit-text)',
        'text-muted': 'var(--unit-text-muted)',
        surface: 'var(--unit-surface)',
        'surface-elevated': 'var(--unit-surface-elevated)',
        border: 'var(--unit-border)',
        error: 'var(--unit-error)',
        warning: 'var(--unit-warning)',
        success: 'var(--unit-success)',
        info: 'var(--unit-info)',
      },
      borderRadius: {
        'unit': 'var(--unit-border-radius)',
        'unit-sm': 'var(--unit-radius-sm)',
      },
      boxShadow: {
        'unit': 'var(--unit-shadow)',
        'unit-lg': 'var(--unit-shadow-lg)',
      },
      fontFamily: {
        'heading': 'var(--unit-font-heading)',
        'body': 'var(--unit-font-body)',
      },
      backgroundImage: {
        'gradient-hero': 'var(--unit-gradient-hero)',
      }
    },
  },
  plugins: [],
};
