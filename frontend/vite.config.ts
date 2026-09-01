import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { pagesHeadersPlugin } from "./vite-plugin-pages-headers";
import { themeBootPlugin } from "./vite-plugin-theme-boot";

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    pagesHeadersPlugin(),
    themeBootPlugin(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectRegister: false,
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest,json}"],
        globIgnores: ["**/mockServiceWorker.js"],
        injectionPoint: undefined,
      },
      manifest: false,
    }),
  ],
  resolve: {
    alias: {
      "@": path.join(dir, "src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
  },
});
