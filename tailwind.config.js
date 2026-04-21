/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brick: {
          50:  "#fdf2f1",
          100: "#fce0dd",
          200: "#f9c0bb",
          300: "#f49490",
          400: "#ec5f5a",
          500: "#c0392b",   // main brick red
          600: "#a93226",
          700: "#8e2a20",
          800: "#74221a",
          900: "#5c1b14",
        },
      },
      fontFamily: {
        sans: ["'Segoe UI'", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
