import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy:    "#0a1628",
        slate:   "#1c2f4a",
        steel:   "#2d4a6b",
        horizon: "#3d7ab5",
        amber:   "#f0a500",
        lime:    "#7ec8a0",
        fog:     "#b8c8d8",
        paper:   "#e8f0f8",
      },
      fontFamily: {
        mono: ["'Share Tech Mono'", "monospace"],
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
