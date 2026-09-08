export const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
export const GIS_SCOPE = "openid email profile";
export const MAGIC_LINK_PATH = "/auth/magic";

export function googleClientId(env: { VITE_GOOGLE_CLIENT_ID?: string } = import.meta.env): string {
  return env.VITE_GOOGLE_CLIENT_ID?.trim() ?? "";
}

export function googleSignInEnabled(
  env: { VITE_GOOGLE_CLIENT_ID?: string } = import.meta.env,
): boolean {
  return googleClientId(env).length > 0;
}

export function magicLinkToken(pathname: string, search: string): string | null {
  if (pathname !== MAGIC_LINK_PATH) {
    return null;
  }
  const token = new URLSearchParams(search).get("token")?.trim() ?? "";
  return token.length > 0 ? token : null;
}
