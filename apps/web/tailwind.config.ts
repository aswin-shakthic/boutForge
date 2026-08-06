import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: "#1B2A4A",
        boxing: "#C8102E",
      },
    },
  },
  plugins: [],
};

export default config;
