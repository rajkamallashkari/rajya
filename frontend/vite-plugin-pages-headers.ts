import { writeFileSync } from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { pagesHeadersFile } from "./src/shared/lib/security/headers";

export function pagesHeadersPlugin(): Plugin {
  return {
    name: "rajya-pages-headers",
    configResolved(config) {
      const dest = path.join(config.root, "public/_headers");
      writeFileSync(dest, pagesHeadersFile(process.env.VITE_API_ORIGIN));
    },
  };
}
