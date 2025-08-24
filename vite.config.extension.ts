import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist-extension",
    rollupOptions: {
      input: {
        sidepanel: path.resolve(__dirname, "public/sidepanel.html"),
        background: path.resolve(__dirname, "public/background.js"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'background' ? 'background.js' : '[name]-[hash].js';
        },
      },
    },
    copyPublicDir: true,
  },
  define: {
    global: "globalThis",
  },
});