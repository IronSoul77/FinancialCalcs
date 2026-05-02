import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        safe: "#0f766e",
        warning: "#b45309",
        urgent: "#b91c1c",
        paid: "#15803d"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(23, 32, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
