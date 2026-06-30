import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1.5rem',
        lg: '2rem',
      },
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        navy: {
          DEFAULT: '#071B33',
          700: '#0D2949',
          900: '#050B12',
        },
        deep_navy: '#03111F',
        gold: {
          DEFAULT: '#F7941D',
          soft: '#FBB04F',
        },
        off_white: '#F7F5EF',
        neutral: {
          200: '#E8E4D6',
          700: '#2A3548',
        },
        border_light: '#E5E0D3',
        border_dark: '#263447',
        text_dark: '#17202A',
        text_light: '#F4F1EA',
        text_muted_light: '#2A3548',
        text_muted_dark: '#A8B3C7',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-fraunces)', 'Georgia', 'serif'],
      },
      fontSize: {
        // Editorial scale
        'eyebrow': ['0.8125rem', { lineHeight: '1.2', letterSpacing: '0.06em', fontWeight: '600' }],
        'h1-d': ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'h1-m': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'h2-d': ['2.75rem', { lineHeight: '1.15', letterSpacing: '-0.015em' }],
        'h2-m': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'h3-d': ['1.75rem', { lineHeight: '1.25' }],
        'h3-m': ['1.375rem', { lineHeight: '1.3' }],
        'indicator-d': ['5rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'indicator-m': ['3rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
      },
      letterSpacing: {
        widest: '0.06em',
      },
      borderRadius: {
        'card': '8px',
        'card-lg': '12px',
        'btn': '6px',
      },
      boxShadow: {
        'premium-light': '0 4px 24px rgba(7, 27, 51, 0.06)',
        'premium-light-hover': '0 12px 32px rgba(7, 27, 51, 0.08)',
        'premium-dark': '0 4px 24px rgba(0, 0, 0, 0.25)',
        'premium-dark-hover': '0 12px 32px rgba(0, 0, 0, 0.35)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #F7941D 0%, #FBB04F 100%)',
        'hero-overlay':
          'linear-gradient(180deg, rgba(3,17,31,0.2) 0%, rgba(3,17,31,0.7) 100%)',
      },
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'scroll-indicator': {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0.6' },
          '50%': { transform: 'translateY(8px)', opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 600ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'shimmer': 'shimmer 2s linear infinite',
        'scroll-indicator': 'scroll-indicator 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
