/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#176B52',
          hover: '#10513F',
          light: '#218366',
          50: '#F2F8F5',
          100: '#DCEBE3',
          200: '#BCD7CA',
          600: '#176B52',
          700: '#10513F',
          800: '#0C3D2F',
        },
        sage: {
          DEFAULT: '#DCEBE3',
          light: '#F2F8F5',
          dark: '#B8D5C6',
        },
        charcoal: {
          DEFAULT: '#202923',
          light: '#2F3C34',
          subtle: '#68746D',
        },
        surface: {
          bg: '#F8FAF8',
          card: '#FFFFFF',
          border: '#E3E9E4',
          hover: '#F2F6F3',
        },
        accent: {
          DEFAULT: '#E5AD52',
          light: '#FEF8EE',
          dark: '#C48D35',
        },
        status: {
          success: '#287653',
          successBg: '#EAF4EE',
          error: '#B93838',
          errorBg: '#FDF1F1',
          warning: '#E5AD52',
          warningBg: '#FEF8EE',
          info: '#2C6E8A',
          infoBg: '#EAF3F7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(32, 41, 35, 0.04), 0 1px 2px -1px rgba(32, 41, 35, 0.04)',
        'card': '0 2px 4px 0 rgba(32, 41, 35, 0.04), 0 1px 2px 0 rgba(32, 41, 35, 0.02)',
        'card-hover': '0 4px 12px 0 rgba(32, 41, 35, 0.08), 0 2px 4px -1px rgba(32, 41, 35, 0.04)',
      }
    },
  },
  plugins: [],
}
