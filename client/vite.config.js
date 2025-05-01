import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import rollupNodePolyFill from "rollup-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      stream: "rollup-plugin-node-polyfills/polyfills/stream",
      buffer: "rollup-plugin-node-polyfills/polyfills/buffer-es6",
      process: "rollup-plugin-node-polyfills/polyfills/process-es6",
    },
  },
  define: {
    global: "window", // ✅ This fixes the ReferenceError
  },
  optimizeDeps: {
    include: ["simple-peer"],
  },
  build: {
    rollupOptions: {
      plugins: [rollupNodePolyFill()],
    },
  },
});
