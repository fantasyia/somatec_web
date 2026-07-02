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
        // Azul institucional oficial (Pantone 2955 C — brandbook Somatec)
        navy: {
          DEFAULT: '#00416E',
          700: '#013457',
          900: '#00253F',
        },
        deep_navy: '#002B47',
        // Ciano institucional (Process Cyan — brandbook Somatec)
        cyan: {
          DEFAULT: '#008CC8',
          soft: '#33A6D6',
        },
        // Acento/CTA — laranja oficial do Master Block (#F39200). Mantém a
        // chave "gold" por compatibilidade com os componentes existentes.
        gold: {
          DEFAULT: '#F39200',
          soft: '#F7B24D',
        },
        off_white: '#F5F8FB',
        neutral: {
          200: '#E1E8EF',
          700: '#33475C',
        },
        border_light: '#DCE4EC',
        border_dark: '#123B57',
        text_dark: '#0E2233',
        text_light: '#EAF2F8',
        text_muted_light: '#33475C',
        text_muted_dark: '#9DB2C4',
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
        'premium-light': '0 4px 24px rgba(0, 65, 110, 0.07)',
        'premium-light-hover': '0 12px 32px rgba(0, 65, 110, 0.10)',
        'premium-dark': '0 4px 24px rgba(0, 0, 0, 0.25)',
        'premium-dark-hover': '0 12px 32px rgba(0, 0, 0, 0.35)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #F39200 0%, #F7B24D 100%)',
        'hero-overlay':
          'linear-gradient(180deg, rgba(0,43,71,0.2) 0%, rgba(0,43,71,0.72) 100%)',
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
        'marquee': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 600ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'shimmer': 'shimmer 2s linear infinite',
        'scroll-indicator': 'scroll-indicator 3s ease-in-out infinite',
        'marquee': 'marquee 50s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
