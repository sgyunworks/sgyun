import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        fg: "#f4f4f4",
        muted: "#8a8a8a",
        line: "#2a2a2a",
      },
      fontFamily: {
        display: ["var(--font-poppins)", "var(--font-pretendard)", "sans-serif"],
        body: ["var(--font-pretendard)", "var(--font-poppins)", "sans-serif"],
      },
      letterSpacing: {
        tighter: "-0.04em",
        tight: "-0.03em",
      },
      maxWidth: {
        wide: "1600px",
      },
    },
  },
  plugins: [],
} satisfies Config;
