import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Em desenvolvimento, encaminha /api para o backend Express (porta 8080).
    // Em produção o próprio Express serve o frontend, então /api já é a mesma origem.
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
});
