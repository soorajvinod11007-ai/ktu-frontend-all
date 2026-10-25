/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:    'rgb(var(--color-primary) / <alpha-value>)',
        secondary:  'rgb(var(--color-secondary) / <alpha-value>)',
        accent:     'rgb(var(--color-accent) / <alpha-value>)',
        background: 'rgb(var(--color-background) / <alpha-value>)',
        card:       'rgb(var(--color-card) / <alpha-value>)',
        muted:      'rgb(var(--color-muted) / <alpha-value>)',
        border:     'rgb(var(--color-border) / <alpha-value>)',
        destructive:'#EF4444',
        ring:       '#FFFFFF',
        fg:         'rgb(var(--color-fg) / <alpha-value>)',
        'fg-muted': 'rgb(var(--color-fg-muted) / <alpha-value>)',
        'accent-amber': '#F59E0B',
        'accent-blue':  '#3B82F6',
        'accent-purple':'#A855F7',
      },
      fontFamily: {
        sans: ['Fira Sans', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
        glow:  '0 0 20px rgba(34,197,94,0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'spin-slow': 'spin 1.5s linear infinite',
        'pulse-slow': 'pulse 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
