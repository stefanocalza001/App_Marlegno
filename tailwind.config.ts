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
        primary: {
          DEFAULT: "#063D37",
          hover: "#042E29",
          light: "#0A524A",
          foreground: "#FFFFFF",
        },
        brand: {
          DEFAULT: "#063D37",
          hover: "#042E29",
          light: "#0A524A",
        },
        background: "#F9FAFB",
        surface: "#FFFFFF",
        marlegno: {
          primary: "#063D37",
          secondary: "#0A524A",
          accent: "#D4A373",
          surface: "#F9FAFB",
        },
      },
      borderRadius: {
        super: "1.5rem",
        "super-lg": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
