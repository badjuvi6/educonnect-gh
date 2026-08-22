/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Deep academic navy - primary brand color, evokes gown/ceremonial trust
        navy: {
          50: '#EEF1F8',
          100: '#D6DDEE',
          200: '#AEBBDD',
          300: '#8698CB',
          400: '#5A6FA8',
          500: '#3C5185',
          600: '#2A3D68',
          700: '#1E2E52',
          800: '#16223E',
          900: '#0F172E',
          950: '#0A0F20',
        },
        // Warm gold accent - inspired by ceremonial Kente gold, used sparingly
        gold: {
          50: '#FDF7EA',
          100: '#FAECC9',
          200: '#F4D890',
          300: '#EEC35A',
          400: '#E4A93F',
          500: '#CC8F2A',
          600: '#A97220',
          700: '#82571C',
          800: '#5C3E17',
          900: '#3D2A10',
        },
        success: {
          50: '#EAF9F0',
          500: '#1F9D55',
          600: '#188044',
        },
        warning: {
          50: '#FDF6E8',
          500: '#DDA426',
          600: '#B8861B',
        },
        danger: {
          50: '#FCEDED',
          500: '#D64545',
          600: '#B23434',
        },
      },
      fontFamily: {
        display: ['"Sora"', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(15, 23, 46, 0.06), 0 1px 3px 0 rgba(15, 23, 46, 0.08)',
        raised: '0 4px 16px -4px rgba(15, 23, 46, 0.18)',
      },
      backgroundImage: {
        'kente-strip':
          'repeating-linear-gradient(45deg, #E4A93F 0, #E4A93F 6px, transparent 6px, transparent 12px)',
      },
    },
  },
  plugins: [],
};
