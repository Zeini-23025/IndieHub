/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'accent-primary': 'var(--accent-primary)',
        'accent-primary-bright': 'var(--accent-primary-bright)',
        'accent-primary-dark': 'var(--accent-primary-dark)',
        'accent-secondary': 'var(--accent-secondary)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'border-color': 'var(--border-color)',
        'success': 'var(--success)',
        'warning': 'var(--warning)',
        'error': 'var(--error)',
      },
      fontFamily: {
        'pixel': ['Press Start 2P', 'cursive'],
        'mono': ['Courier New', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 15px var(--glow-color)',
        'glow-lg': '0 0 25px var(--glow-color)',
      },
    },
  },
  plugins: [],
}
