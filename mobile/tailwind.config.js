/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        border: "#27272a",
        input: "#27272a",
        ring: "#d4d4d8",
        background: "#09090b",
        foreground: "#fafafa",
        primary: {
          DEFAULT: "#fafafa",
          foreground: "#18181b",
        },
        secondary: {
          DEFAULT: "#27272a",
          foreground: "#fafafa",
        },
        destructive: {
          DEFAULT: "#7f1d1d",
          foreground: "#fafafa",
        },
        muted: {
          DEFAULT: "#27272a",
          foreground: "#a1a1aa",
        },
        accent: {
          DEFAULT: "#27272a",
          foreground: "#fafafa",
        },
        card: {
          DEFAULT: "#09090b",
          foreground: "#fafafa",
        },
      },
    },
  },
  plugins: [],
};
