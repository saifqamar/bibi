/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        background: { DEFAULT: "#fcfcfb", dark: "#121212" },
        foreground: { DEFAULT: "#16161d", dark: "#f0efec" },
        muted: { DEFAULT: "#6b6a73", dark: "#a5a4ad" },
        card: { DEFAULT: "#ffffff", dark: "#1e1e22" },
        border: { DEFAULT: "#e4e3e8", dark: "#33333a" },
        primary: { DEFAULT: "#5b3fd1", dark: "#a996ff" },
        danger: "#c4362b",
      },
    },
  },
  plugins: [],
};
