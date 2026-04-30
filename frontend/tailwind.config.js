/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // dark mode via .dark class on <html>
  theme: {
    extend: {
      colors: {
        // Light mode palette
        cream: '#F8F6F0',
        charcoal: '#1C1C1C',
        border_light: '#E5E0D8',
        shu_light: '#C82A2A',
        // Dark mode palette
        void: '#0A0A0A',
        offwhite: '#F2F2F2',
        border_dark: '#2A2A2A',
        shu_dark: '#FF4A4A',
        // Dynamic Theme Variables
        bg: 'rgba(var(--bg-color), <alpha-value>)',
        theme: 'rgba(var(--text-color), <alpha-value>)',
        accent: 'rgba(var(--accent-color), <alpha-value>)',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
      letterSpacing: {
        'ultra-wide': '0.4em',
        'widest-xl': '0.25em',
      },
      animation: {
        'marquee': 'marquee 50s linear infinite',
        'marquee-fast': 'marquee 35s linear infinite',
        'reveal-up': 'revealUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        revealUp: {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
