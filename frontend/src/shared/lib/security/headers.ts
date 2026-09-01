export const PAGES_ORIGIN = "https://rajya.pages.dev";
export const OSM_TILES = "https://tile.openstreetmap.org";
export const TENOR_API = "https://tenor.googleapis.com";
export const TENOR_MEDIA = "https://*.tenor.com";
export const R2_STORAGE = "https://*.r2.cloudflarestorage.com";
export const R2_PUBLIC = "https://*.r2.dev";
export const FONTS_CSS = "https://fonts.googleapis.com";
export const FONTS_FILES = "https://fonts.gstatic.com";
export const TUNNEL_HTTPS = "https://*.trycloudflare.com";
export const TUNNEL_WSS = "wss://*.trycloudflare.com";
export const LOCAL_API = "http://localhost:3000";
export const LOCAL_API_WS = "ws://localhost:3000";
export const LOCAL_LOOPBACK_API = "http://127.0.0.1:3000";
export const LOCAL_LOOPBACK_API_WS = "ws://127.0.0.1:3000";

export const PERMISSIONS_POLICY =
  "camera=(self), microphone=(self), display-capture=(self), geolocation=(self), fullscreen=(self), autoplay=(self), payment=(), usb=(), gyroscope=(), accelerometer=(), magnetometer=(), midi=()";

export function cableOriginFromHttp(origin: string): string {
  return origin.replace(/^http/i, "ws");
}

export function connectSources(apiOrigin?: string): string[] {
  const extra = apiOrigin?.replace(/\/$/, "") ?? "";
  const extras =
    extra.length > 0 && extra !== LOCAL_API && extra !== LOCAL_LOOPBACK_API
      ? [extra, cableOriginFromHttp(extra)]
      : [];
  return [
    "'self'",
    PAGES_ORIGIN,
    LOCAL_API,
    LOCAL_API_WS,
    LOCAL_LOOPBACK_API,
    LOCAL_LOOPBACK_API_WS,
    TUNNEL_HTTPS,
    TUNNEL_WSS,
    R2_STORAGE,
    R2_PUBLIC,
    OSM_TILES,
    TENOR_API,
    TENOR_MEDIA,
    FONTS_CSS,
    ...extras,
  ];
}

export function contentSecurityPolicy(apiOrigin?: string): string {
  return [
    "default-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "manifest-src 'self'",
    "script-src 'self'",
    `style-src 'self' 'unsafe-inline' ${FONTS_CSS}`,
    `font-src 'self' data: ${FONTS_FILES}`,
    `img-src 'self' data: blob: ${R2_STORAGE} ${R2_PUBLIC} ${OSM_TILES} ${TENOR_MEDIA}`,
    `media-src 'self' blob: ${R2_STORAGE} ${R2_PUBLIC} ${TENOR_MEDIA}`,
    `connect-src ${connectSources(apiOrigin).join(" ")}`,
    "worker-src 'self' blob:",
  ].join("; ");
}

export function pagesHeadersFile(apiOrigin?: string): string {
  return [
    "/*",
    `  Content-Security-Policy: ${contentSecurityPolicy(apiOrigin)}`,
    `  Permissions-Policy: ${PERMISSIONS_POLICY}`,
    "",
  ].join("\n");
}
