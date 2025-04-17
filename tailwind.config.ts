
import { type Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "clipvobe-cyan": "#00FFFF",
        "clipvobe-dark": "#07070F",
        "clipvobe-gray-800": "#1A1A2E",
        "clipvobe-gray-700": "#2A2A3E",
        "clipvobe-gray-400": "#A3A3C2",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        first: {
          "0%": { transform: "translateX(-30%) translateY(-50%) scale(1)" },
          "50%": { transform: "translateX(-25%) translateY(20%) scale(1.2)" },
          "100%": { transform: "translateX(-30%) translateY(-50%) scale(1)" },
        },
        second: {
          "0%": { transform: "translateX(-40%) translateY(-30%) scale(1.2)" },
          "50%": { transform: "translateX(0%) translateY(20%) scale(0.9)" },
          "100%": { transform: "translateX(-40%) translateY(-30%) scale(1.2)" },
        },
        third: {
          "0%": { transform: "translateX(40%) translateY(10%) scale(1.2)" },
          "50%": { transform: "translateX(20%) translateY(40%) scale(0.8)" },
          "100%": { transform: "translateX(40%) translateY(10%) scale(1.2)" },
        },
        fourth: {
          "0%": { transform: "translateX(20%) translateY(-30%) scale(1.6)" },
          "50%": { transform: "translateX(30%) translateY(-40%) scale(0.6)" },
          "100%": { transform: "translateX(20%) translateY(-30%) scale(1.6)" },
        },
        fifth: {
          "0%": { transform: "translateX(-30%) translateY(30%) scale(1)" },
          "33%": { transform: "translateX(25%) translateY(-20%) scale(1.2)" },
          "66%": { transform: "translateX(-25%) translateY(20%) scale(0.8)" },
          "100%": { transform: "translateX(-30%) translateY(30%) scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        first: "first 10s infinite",
        second: "second 10s infinite",
        third: "third 10s infinite",
        fourth: "fourth 10s infinite",
        fifth: "fifth 10s infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
