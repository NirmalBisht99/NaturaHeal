import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // During dev: proxy /api and /ws to the backend so CORS is never an issue
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target:      "http://localhost:4000",
        changeOrigin: true,
      },
      "/ws": {
        target:  "ws://localhost:4000",
        ws:      true,
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir:      "dist",
    // Raise the chunk-size warning threshold so the build doesn't print walls of warnings
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Split vendor code into a separate chunk for better caching
        manualChunks: {
          vendor: ["react", "react-dom"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
});