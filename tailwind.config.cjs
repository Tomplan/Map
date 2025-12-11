/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        brand: {
          orange: '#ff6b35',
          'orange-dark': '#e55a2b',
          blue: '#1976d2',
          'blue-dark': '#1565c0',
        },
        // Form Input System
        input: {
          text: '#111827', // gray-900 (high contrast)
          placeholder: '#9ca3af', // gray-400
          border: '#d1d5db', // gray-300
          'border-focus': '#ff6b35', // orange on focus
          bg: '#ffffff',
          'bg-disabled': '#f3f4f6', // gray-100
        },
        // Button System
        button: {
          primary: '#ff6b35',
          'primary-hover': '#e55a2b',
          secondary: '#1976d2',
          'secondary-hover': '#1565c0',
        },
      },
    },
  },
  plugins: [],
};
