/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        card: "0 6px 20px -10px rgba(15, 23, 42, 0.35)",
      },
    },
  },
  plugins: [],
};
