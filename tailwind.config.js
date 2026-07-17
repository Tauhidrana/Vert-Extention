export default {
  content: ["./src/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        zbg: "#080C12",
        zsurface: "#0F1419",
        zcard: "#141A22",
        zgreen: "#4ADE80",
        zgreenDim: "#2A9D5C",
        zhighlight: "#B8FF2C",
        zwhite: "#FFFFFF",
        zmuted: "rgba(255,255,255,0.55)",
        zsubtle: "rgba(255,255,255,0.08)"
      },
      boxShadow: {
        premium: "0 24px 80px rgba(0,0,0,0.5)",
        glow: "0 0 40px rgba(74,222,128,0.3)",
        glowSoft: "0 0 20px rgba(74,222,128,0.15)",
        cardHover: "0 8px 40px rgba(0,0,0,0.4), 0 0 24px rgba(74,222,128,0.12)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      animation: {
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "fade-in": "fade-in 0.4s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
        "scale-in": "scale-in 0.3s ease-out"
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": { opacity: "0.7", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" }
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" }
        }
      }
    }
  },
  plugins: []
};
