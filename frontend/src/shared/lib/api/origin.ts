export function apiOrigin(
  env: Pick<ImportMetaEnv, "VITE_API_ORIGIN"> = import.meta.env,
  locationOrigin: string = window.location.origin,
): string {
  const configured = env.VITE_API_ORIGIN?.replace(/\/$/, "");
  if (configured) {
    return configured;
  }
  return locationOrigin;
}

export function cableHttpToWs(origin: string): string {
  return origin.replace(/^http/i, "ws");
}
