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
      return html.replace("<!--theme-boot-->", `<script src="/theme-boot.js"></script>`);
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0];
        if (url !== "/theme-boot.js") {
          next();
          return;
        }
        void bundleThemeBoot().then((script) => {
          res.setHeader("Content-Type", "application/javascript; charset=utf-8");
          res.end(script);
        });
      });
    },
    async generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "theme-boot.js",
        source: await bundleThemeBoot(),
      });
    },
  };
}
