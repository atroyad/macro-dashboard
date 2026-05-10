/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#08080e',
          card: '#0f0f18',
          elevated: '#15151f',
          border: '#1e1e2d',
        },
        accent: {
          teal: '#00d4aa',
          blue: '#3b82f6',
          purple: '#8b5cf6',
          orange: '#f59e0b',
          red: '#ef4444',
          green: '#22c55e',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

