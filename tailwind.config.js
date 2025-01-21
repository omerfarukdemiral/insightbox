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
        primary: {
          dark: '#0A192F',
          DEFAULT: '#112240',
          light: '#1E3A8A',
        },
        background: {
          dark: '#0F1117',
          DEFAULT: '#171923',
          light: '#1A202C',
        },
        accent: {
          blue: '#60A5FA',
          purple: '#9F7AEA',
        }
      },
      fontFamily: {
        'sans': ['Merriweather', 'serif'],
        'display': ['Merriweather', 'serif'],
        'body': ['Merriweather', 'serif'],
        'merriweather': ['Merriweather', 'serif'],
      },
      fontWeight: {
        'light': 300,
        'normal': 400,
        'medium': 500,
        'semibold': 600,
        'bold': 700,
        'extrabold': 900,
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(to right, #0A192F, #112240)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          },
        }
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.3s ease-out'
      }
    },
  },
  plugins: [],
}

