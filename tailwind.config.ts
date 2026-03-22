import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* ----------------------------------------
         Colors — mapped to CSS custom properties
         ---------------------------------------- */
      colors: {
        "violet-profond": "var(--violet-profond)",
        "violet-royal": "var(--violet-royal)",
        "violet-mystique": "var(--violet-mystique)",
        "pourpre-sorciere": "var(--pourpre-sorciere)",

        "teal-magique": "var(--teal-magique)",
        "teal-profond": "var(--teal-profond)",
        "turquoise-cristal": "var(--turquoise-cristal)",

        "magenta-rituel": "var(--magenta-rituel)",
        "fuchsia-enchante": "var(--fuchsia-enchante)",
        "or-ancien": "var(--or-ancien)",
        "or-clair": "var(--or-clair)",
        "bronze-rune": "var(--bronze-rune)",

        "noir-nuit": "var(--noir-nuit)",
        "charbon-mystere": "var(--charbon-mystere)",
        "gris-fumee": "var(--gris-fumee)",
        parchemin: "var(--parchemin)",
        "parchemin-vieilli": "var(--parchemin-vieilli)",
        "blanc-lune": "var(--blanc-lune)",
      },

      /* ----------------------------------------
         Font Families
         ---------------------------------------- */
      fontFamily: {
        "cinzel-decorative": ["'Cinzel Decorative'", "serif"],
        cinzel: ["'Cinzel'", "serif"],
        cormorant: ["'Cormorant Garamond'", "serif"],
        philosopher: ["'Philosopher'", "sans-serif"],
        medieval: ["'MedievalSharp'", "cursive"],
      },

      /* ----------------------------------------
         Animations
         ---------------------------------------- */
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 10s ease-in-out infinite",
        "float-reverse": "float-reverse 8s ease-in-out infinite",
        "mist-fade": "mist-fade 12s ease-in-out infinite",
        "mist-drift": "mist-drift 20s ease-in-out infinite",
        twinkle: "twinkle 4s ease-in-out infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "rune-spin": "rune-spin 20s linear infinite",
        "float-up": "float-up 15s linear infinite",
        "fade-in-up": "fade-in-up 0.8s ease-out forwards",
      },

      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "25%": { transform: "translateY(-12px) rotate(2deg)" },
          "50%": { transform: "translateY(-20px) rotate(0deg)" },
          "75%": { transform: "translateY(-8px) rotate(-2deg)" },
        },
        "float-reverse": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "25%": { transform: "translateY(10px) rotate(-1.5deg)" },
          "50%": { transform: "translateY(18px) rotate(0deg)" },
          "75%": { transform: "translateY(6px) rotate(1.5deg)" },
        },
        "mist-fade": {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.05)" },
        },
        "mist-drift": {
          "0%": { transform: "translateX(0) scaleX(1)", opacity: "0.4" },
          "25%": { opacity: "0.6" },
          "50%": { transform: "translateX(10%) scaleX(1.1)", opacity: "0.3" },
          "75%": { opacity: "0.5" },
          "100%": { transform: "translateX(0) scaleX(1)", opacity: "0.4" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        "glow-pulse": {
          "0%, 100%": {
            filter: "drop-shadow(0 0 4px rgba(107, 63, 160, 0.4))",
          },
          "50%": {
            filter:
              "drop-shadow(0 0 16px rgba(107, 63, 160, 0.8)) drop-shadow(0 0 32px rgba(201, 168, 76, 0.3))",
          },
        },
        "rune-spin": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "float-up": {
          "0%": { transform: "translateY(0) rotate(0deg)", opacity: "0" },
          "10%": { opacity: "var(--rune-opacity, 0.15)" },
          "90%": { opacity: "var(--rune-opacity, 0.15)" },
          "100%": {
            transform: "translateY(-100vh) rotate(360deg)",
            opacity: "0",
          },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },

      /* ----------------------------------------
         Extended Spacing
         ---------------------------------------- */
      spacing: {
        "128": "32rem",
        "144": "36rem",
      },

      /* ----------------------------------------
         Extended Screens
         ---------------------------------------- */
      screens: {
        "3xl": "1920px",
      },
    },
  },
  plugins: [],
};

export default config;
