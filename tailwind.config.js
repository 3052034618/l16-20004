/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: "#FCE4EC",
          100: "#F8BBD0",
          200: "#F48FB1",
          300: "#F06292",
          400: "#EC407A",
          500: "#E91E63",
          600: "#D81B60",
          700: "#C2185B",
          800: "#AD1457",
          900: "#880E4F",
        },
        accent: {
          50: "#E0F7FA",
          100: "#B2EBF2",
          200: "#80DEEA",
          300: "#4DD0E1",
          400: "#26C6DA",
          500: "#00ACC1",
          600: "#0097A7",
          700: "#00838F",
          800: "#006064",
          900: "#004D40",
        },
      },
      fontFamily: {
        sans: ["Noto Sans SC", "system-ui", "sans-serif"],
        serif: ["Noto Serif SC", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
