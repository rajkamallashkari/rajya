import { BASE64_GROUP } from "./constants";

export function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const remainder = value.length % BASE64_GROUP;
  const pad = remainder === 0 ? "" : "=".repeat(BASE64_GROUP - remainder);
  const normalized = `${value}${pad}`.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}
