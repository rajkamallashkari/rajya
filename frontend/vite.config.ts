import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { pagesHeadersPlugin } from "./vite-plugin-pages-headers";
import { themeBootPlugin } from "./vite-plugin-theme-boot";

const dir = path.dirname(fileURLToPath(import.meta.url));
const rails = "http://127.0.0.1:3000";

export default defineConfig({
  // Rails Dotenv and Vite share `rajya/.env`. Do not add frontend/.env.*.
  envDir: path.join(dir, ".."),
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
    proxy: {
      "/api": { target: rails, changeOrigin: true },
      "/auth": { target: rails, changeOrigin: true },
      "/cable": { target: rails, ws: true, changeOrigin: true },
      "/health": { target: rails },
      "/up": { target: rails },
    },
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
  },
});
