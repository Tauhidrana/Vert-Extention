export default {
  content: ["./src/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        zbg: "#0B0F14",
        zsurface: "#121821",
        zgreen: "#4ADE80",
        zhighlight: "#B8FF2C",
        zwhite: "#FFFFFF"
      },
      boxShadow: {
        premium: "0 24px 80px rgba(0,0,0,0.45)",
        glow: "0 0 32px rgba(74,222,128,0.24)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
