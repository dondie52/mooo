import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // LMHTS palette — Botswana earth tones, forest green primary
        forest: {
          deep: "#0f2318",
          mid: "#1c3829",
          light: "#2d5840",
          accent: "#4a8260",
        },
        gold: {
          DEFAULT: "#c8861a",
          light: "#e8a93d",
          dark: "#9c6510",
        },
        earth: {
          cream: "#faf7f0",
          sand: "#f2ead6",
          stone: "#e8dfc8",
        },
        alert: {
          red: "#c0392b",
          amber: "#e8a93d",
          green: "#3a7d4c",
        },
        muted: "#6b7564",
        border: "#e5e0d2",
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(28, 56, 41, 0.06), 0 1px 2px rgba(28, 56, 41, 0.04)",
        "card-hover": "0 4px 12px rgba(28, 56, 41, 0.1), 0 2px 4px rgba(28, 56, 41, 0.06)",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease-out both",
        "fade-in": "fadeIn 0.3s ease-out both",
        "scale-in": "scaleIn 0.2s ease-out both",
        "scale-out": "scaleOut 0.15s ease-in both",
        "slide-in-left": "slideInLeft 0.3s ease-out both",
        "toast-in": "toastIn 0.35s ease-out both",
        "toast-out": "toastOut 0.25s ease-in both",
        spin: "spin 0.6s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        scaleOut: {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.97)" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        toastIn: {
          "0%": { opacity: "0", transform: "translateY(8px) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        toastOut: {
          "0%": { opacity: "1", transform: "translateY(0) scale(1)" },
          "100%": { opacity: "0", transform: "translateY(8px) scale(0.96)" },
        },
        spin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
