import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";
import rajya from "./eslint-plugin-rajya/index.js";

export default defineConfig(
  globalIgnores([
    "dist/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "node_modules/**",
    "eslint-plugin-rajya/fixtures/**",
    "public/mockServiceWorker.js",
    "src/shared/lib/api/schema.d.ts",
    "src/shared/lib/config/settings-registry.d.ts",
  ]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      rajya,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": "off",
      "rajya/no-raw-button": "error",
      "rajya/no-hardcoded-hex": "error",
      "rajya/no-z-index-literal": "error",
      "rajya/no-user-facing-string": "error",
      "rajya/no-whole-store-zustand": "error",
    },
  },
  {
    files: ["**/*.mjs"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  prettier,
);
