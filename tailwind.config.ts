import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        marlegno: {
          primary: "#1B4332",
          secondary: "#2D6A4F",
          accent: "#D4A373",
          surface: "#F8FAFC",
        },
      },
    },
  },
  plugins: [],
};

export default config;
