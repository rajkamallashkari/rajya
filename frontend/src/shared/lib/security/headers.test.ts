import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  cableOriginFromHttp,
  connectSources,
  contentSecurityPolicy,
  OSM_TILES,
  pagesHeadersFile,
  PAGES_ORIGIN,
  PERMISSIONS_POLICY,
  R2_STORAGE,
  TENOR_API,
  TENOR_MEDIA,
} from "./headers";

const dir = path.dirname(fileURLToPath(import.meta.url));
const headersPath = path.join(dir, "../../../../public/_headers");

describe("Pages security headers", () => {
  it("covers Pages, Cable, R2, OSM, and Tenor on connect-src", () => {
    const sources = connectSources();
    expect(sources).toContain(PAGES_ORIGIN);
    expect(sources).toContain("wss://*.trycloudflare.com");
    expect(sources).toContain(R2_STORAGE);
    expect(sources).toContain(OSM_TILES);
    expect(sources).toContain(TENOR_API);
    expect(sources).toContain(TENOR_MEDIA);
    expect(cableOriginFromHttp("https://api.example")).toBe("wss://api.example");
    expect(connectSources("https://api.example")).toContain("https://api.example");
    expect(connectSources("https://api.example")).toContain("wss://api.example");
    expect(connectSources("http://localhost:3000")).not.toContain("https://api.example");
  });

  it("matches the committed Cloudflare Pages _headers file", () => {
    const committed = readFileSync(headersPath, "utf8");
    expect(committed).toBe(pagesHeadersFile());
    expect(committed).toContain("script-src 'self'");
    expect(committed).toContain(PERMISSIONS_POLICY.split(",")[0]);
    expect(contentSecurityPolicy()).toContain("unsafe-inline");
  });
});
