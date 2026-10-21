/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        theme: {
          page: 'var(--bg-page)',
          surface: 'var(--bg-surface)',
          secondary: 'var(--bg-surface-secondary)',
          elevated: 'var(--bg-elevated)',
          hover: 'var(--bg-hover)',
          input: 'var(--bg-input)',
          primary: 'var(--text-primary)',
          muted: 'var(--text-secondary)',
          subtle: 'var(--text-muted)',
          border: 'var(--border-color)',
          'border-subtle': 'var(--border-subtle)',
          emerald: 'var(--primary-emerald)',
          'emerald-hover': 'var(--primary-emerald-hover)',
          'emerald-light': 'var(--primary-emerald-light)',
          'emerald-text': 'var(--primary-emerald-text)',
          indigo: 'var(--accent-indigo)',
          'indigo-light': 'var(--accent-indigo-light)',
          'indigo-text': 'var(--accent-indigo-text)',
          link: 'var(--link-color)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        'float': '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
        'dark-card': '0 4px 12px 0 rgba(0, 0, 0, 0.4)'
      }
    },
  },
  plugins: [],
}
