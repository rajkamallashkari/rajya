export const ACCOUNTS_STORAGE_KEY = "rajya:accounts";

export const JWT_PARTS = 3;
export const MS_PER_SECOND = 1000;
export const BASE64_BLOCK = 4;

function padBase64(base64: string): string {
  const remainder = base64.length % BASE64_BLOCK;
  if (remainder === 0) {
    return base64;
  }
  return `${base64}${"=".repeat(BASE64_BLOCK - remainder)}`;
}

export function isJwtExpired(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== JWT_PARTS) {
    return false;
  }
  const payloadPart = parts[1] as string;
  try {
    const payload = JSON.parse(
      atob(padBase64(payloadPart.replace(/-/g, "+").replace(/_/g, "/"))),
    ) as { exp?: number };
    if (typeof payload.exp !== "number") {
      return true;
    }
    return Date.now() >= payload.exp * MS_PER_SECOND;
  } catch {
    return true;
  }
}
