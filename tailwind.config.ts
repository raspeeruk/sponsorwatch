import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0E1A",
        paper: "#F4F1EA",
        "paper-dim": "#EAE5D9",
        rule: "#1A1D2E",
        crown: "#1B4332",
        flag: "#C8102E",
        ledger: "#3E4D2F",
        stamp: "#8B6B2C",
      },
      fontFamily: {
        display: ['"Fraunces"', "serif"],
        body: ['"Public Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      maxWidth: {
        content: "1120px",
      },
    },
  },
  plugins: [],
};

export default config;
