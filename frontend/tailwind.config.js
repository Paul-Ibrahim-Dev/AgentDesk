/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Dashboard accent — same teal family as `signal` below, tuned
        // with enough light-end shades for readable text/badges on white.
        // Keeps the work-tool dashboard visually connected to the
        // marketing site's signal color without needing a dark theme.
        brand: {
          50: '#EAFBF7',
          100: '#CFF6EC',
          200: '#9FEBDA',
          300: '#66DBC4',
          400: '#35C6AC',
          500: '#1FA98F',
          600: '#158A75',
          700: '#136F60',
          800: '#12594E',
          900: '#0F4941',
        },
        // Deep indigo-space base — the "night switchboard" the signal
        // motif lives on. Deliberately blue-violet, not a tinted-black.
        ink: {
          950: '#060917',
          900: '#0A0E27',
          800: '#121937',
          700: '#1A2348',
          600: '#26305C',
          500: '#3A4676',
        },
        // Cool accent — the AI / digital signal.
        signal: {
          400: '#6FF0DA',
          500: '#35E6C5',
          600: '#1FBFA3',
        },
        // Warm accent — the human, Nigerian small-business side.
        amber: {
          400: '#FFBB6B',
          500: '#FFA53E',
          600: '#F08421',
        },
        paper: '#F6F7FB',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grid-lines':
          'linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)',
      },
      keyframes: {
        pulse_travel: {
          '0%': { offsetDistance: '0%', opacity: '0' },
          '8%': { opacity: '1' },
          '92%': { opacity: '1' },
          '100%': { offsetDistance: '100%', opacity: '0' },
        },
        glow_pulse: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        glow: 'glow_pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
