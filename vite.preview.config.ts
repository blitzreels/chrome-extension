import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "preview",
  plugins: [react(), tailwindcss()],
  server: { host: "127.0.0.1", port: 3188, strictPort: true },
});
