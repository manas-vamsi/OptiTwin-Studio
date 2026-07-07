import type { Config } from "tailwindcss";

// Design tokens live as CSS variables in globals.css (ported from the prototype).
// Tailwind is available for layout utilities; the component classes carry the look.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        gold: "var(--gold)",
        "gold-hi": "var(--gold-hi)",
        emerald: "var(--emerald)",
        amber: "var(--amber)",
        crimson: "var(--crimson)",
      },
    },
  },
  plugins: [],
};
export default config;
