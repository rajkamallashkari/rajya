import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.join(dir, "src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: [path.join(dir, "src/test/setup.ts")],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "eslint-plugin-rajya/**/*.test.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts", "src/**/*.test.ts", "src/**/*.test.tsx", "src/test/**"],
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      },
    },
  },
});
