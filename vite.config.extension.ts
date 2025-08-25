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
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      },
    },
    copyPublicDir: true,
    minify: false,
  },
  define: {
    global: "globalThis",
  },
});