import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import type { Plugin } from "vite";

const dir = path.dirname(fileURLToPath(import.meta.url));

export async function bundleThemeBoot(): Promise<string> {
  const result = await esbuild({
    absWorkingDir: dir,
    entryPoints: [path.join(dir, "src/shared/lib/theme/boot-entry.ts")],
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    target: "es2020",
    minify: true,
  });
  const file = result.outputFiles[0];
  if (!file) {
    throw new Error("theme_boot_bundle_empty");
  }
  return file.text;
}

export function themeBootPlugin(): Plugin {
  return {
    name: "rajya-theme-boot",
    async transformIndexHtml(html) {
      const script = await bundleThemeBoot();
      return html.replace("<!--theme-boot-->", `<script>${script}</script>`);
    },
  };
}
