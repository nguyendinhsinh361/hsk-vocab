import type { Config } from 'tailwindcss';

// Token đồng bộ với design/design-tokens.md (Figma). Primary #00B2A5.
const config: Config = {
  darkMode: 'class',
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          100: '#E5F7F6',
          200: '#91DED8',
          300: '#5ECEC6',
          DEFAULT: '#00B2A5',
          500: '#00B2A5',
          700: '#008F85',
          800: '#00655E',
        },
        neutral: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          800: '#1E293B',
          900: '#0F172A',
        },
        // Nhánh từ (cây từ gốc) — khớp Figma
        blue: { 50: '#E3F2FD', 400: '#42A5F5', 700: '#1976D2', 800: '#1565C0' },
        red: { 50: '#FFEBEE', 400: '#EF5350', 700: '#D32F2F' },
        violet: { 50: '#EEEBFF', 400: '#785BFF', 700: '#543ACC' },
        success: '#22C55E',
        danger: '#EF4444',
      },
      fontFamily: {
        // Quicksand cho UI; Huninn riêng cho chữ Hán (font-han).
        sans: ['var(--font-quicksand)', 'system-ui', 'sans-serif'],
        han: ['var(--font-han)', 'var(--font-quicksand)', 'serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15,23,42,0.04), 0 10px 30px -16px rgba(15,23,42,0.18)',
      },
    },
  },
  plugins: [],
};

export default config;
