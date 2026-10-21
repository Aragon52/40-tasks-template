/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./admin.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./user-portal/**/*.{js,ts,jsx,tsx}",
    "./admin-portal/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Unified Brand Palette
        brand: {
          blue: "#0071ce",    // Walmart Blue
          yellow: "#FFC220",  // Walmart Yellow
          dark: "#181d28",    // Deep Charcoal
          ivory: "#fcfbf9",   // Ivory Cream
        },
        primary: {
          DEFAULT: "#0071ce",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#FFC220",
          foreground: "#181d28",
        },
        neutral: {
          DEFAULT: "#5e6b7c",
          dark: "#181d28",
          light: "#94a3b8",
        },
        success: {
          DEFAULT: "#10b981",
          foreground: "#ffffff",
        },
        error: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        warning: {
          DEFAULT: "#f59e0b",
          foreground: "#ffffff",
        },
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        'luxury': '0 20px 40px -12px rgba(0, 0, 0, 0.1)',
      },
      keyframes: {
        'pulse-flash': {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: 'rgba(16, 185, 129, 0.25)', transform: 'scale(1.005)' }
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-flash': 'pulse-flash 1.2s ease-in-out 1',
      }
    },
  },
  plugins: [],
}
