import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "brand-navy": "#0A1628",
        "electric-blue": "#4A90E2",
        "soft-indigo": "#6C8EE8",
        emerald: "#2ECC71",
        coral: "#E74C3C",
        amber: "#F39C12",
        teal: "#1ABC9C",
        violet: "#9B59B6",
        "off-white": "#F8FAFC",
        "light-gray": "#EDF0F4",
        "mid-gray": "#94A3B8",
        "dark-gray": "#475569",
        "near-black": "#1E293B",
        "dark-surface": "#111827",
        "dark-border": "#1F2937"
      },
      borderRadius: {
        xs: "2px",
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
        full: "9999px"
      },
      boxShadow: {
        "level-1": "0px 1px 3px rgba(0,0,0,0.08)",
        "level-2": "0px 4px 12px rgba(0,0,0,0.10)",
        "level-3": "0px 8px 24px rgba(0,0,0,0.12)",
        "level-4": "0px 16px 40px rgba(0,0,0,0.16)"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      fontSize: {
        "display-lg": ["32px", { lineHeight: "1.2", letterSpacing: "-0.5px", fontWeight: "700" }],
        "display-md": ["28px", { lineHeight: "1.25", letterSpacing: "-0.5px", fontWeight: "700" }],
        h1: ["24px", { lineHeight: "1.3", letterSpacing: "-0.3px", fontWeight: "600" }],
        h2: ["20px", { lineHeight: "1.35", letterSpacing: "-0.3px", fontWeight: "600" }],
        h3: ["18px", { lineHeight: "1.4", letterSpacing: "-0.3px", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "1.6" }],
        "body-md": ["15px", { lineHeight: "1.55" }],
        "body-sm": ["14px", { lineHeight: "1.5" }],
        caption: ["12px", { lineHeight: "1.4", letterSpacing: "0.2px" }],
        label: ["13px", { lineHeight: "1.0", letterSpacing: "0.2px", fontWeight: "500" }],
        micro: ["11px", { lineHeight: "1.0", letterSpacing: "0.2px", fontWeight: "500" }]
      }
    }
  },
  plugins: []
};

export default config;
