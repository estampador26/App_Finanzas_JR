/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#4338CA', // Indigo 700
          light: '#4f46e5',   // Indigo 600
          dark: '#3730a3',    // Indigo 800
        },
        neutral: {
          '50': '#F9FAFB',
          '100': '#F3F4F6',
          '200': '#E5E7EB',
          '300': '#D1D5DB',
          '400': '#9CA3AF',
          '500': '#6B7280',
          '600': '#4B5563',
          '700': '#374151',
          '800': '#1F2937',
          '900': '#111826',
        },
        accent: {
          success: '#10B981', // Emerald 500
          error: '#EF4444',   // Red 500
          warning: '#F59E0B', // Amber 500
        }
      }
    },
  },
  plugins: [],
}
