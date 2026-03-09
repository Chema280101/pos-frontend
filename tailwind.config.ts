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
        'unit-secondary': 'var(--unit-secondary)',
        'unit-accent': 'var(--unit-accent)',
        'unit-text': 'var(--unit-text)',
        'unit-surface': 'var(--unit-surface)',
      },
      borderRadius: {
        unit: 'var(--unit-border-radius)',
      },
      boxShadow: {
        unit: 'var(--unit-shadow)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
