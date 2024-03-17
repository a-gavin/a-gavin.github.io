/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./templates/**/*.html"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Iosevka Web"],
      },
      fontSize: {
        sm: "1rem",
        base: "1.25rem",
        xl: "1.563rem",
        "2xl": "1.953rem",
        "3xl": "2.441rem",
        "4xl": "3.052rem",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
