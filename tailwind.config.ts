import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        celo:    { DEFAULT: '#35D07F', dark: '#1a6b40' },
        gold:    '#FBCC5C',
        purple:  '#8B5CF6',
        cyan:    '#22D3EE',
        pink:    '#EC4899',
        space:   '#070A0F',
        panel:   '#0B1018',
      },
      fontFamily: {
        mono:  ['var(--font-mono)', 'monospace'],
        title: ['var(--font-title)', 'sans-serif'],
      },
      animation: {
        'float':    'float 4s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow':     'glow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in':  'fadeIn 0.4s ease-out',
      },
      keyframes: {
        float:   { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        glow:    { '0%,100%': { opacity: '0.6' }, '50%': { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(53,208,127,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(53,208,127,0.05) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
}

export default config
