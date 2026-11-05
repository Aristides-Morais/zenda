import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174, // Muda a porta para não chocar com o Zenda
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});