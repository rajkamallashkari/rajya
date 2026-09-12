import { GIS_SCOPE, GIS_SCRIPT_SRC, googleClientId } from "@/features/auth/model/gate-config";

export interface GoogleCodeClient {
  requestCode: () => void;
}

export interface GoogleIdentityWindow {
  google?: {
    accounts?: {
      oauth2?: {
        initCodeClient: (config: {
          client_id: string;
          scope: string;
          ux_mode: "popup";
          callback: (response: { code?: string }) => void;
          error_callback?: () => void;
        }) => GoogleCodeClient;
      };
    };
  };
}

let loading: Promise<void> | null = null;

export function gisReady(host: GoogleIdentityWindow = window as GoogleIdentityWindow): boolean {
  return typeof host.google?.accounts?.oauth2?.initCodeClient === "function";
}

export async function loadGoogleIdentityServices(
  doc: Document = document,
  host: GoogleIdentityWindow = window as GoogleIdentityWindow,
): Promise<void> {
  if (gisReady(host)) {
    return;
  }
  if (loading) {
    return loading;
  }
  loading = new Promise<void>((resolve, reject) => {
    const existing = doc.querySelector(`script[src="${GIS_SCRIPT_SRC}"]`);
    const script = existing instanceof HTMLScriptElement ? existing : doc.createElement("script");
    const succeed = () => resolve();
    script.addEventListener("load", succeed);
    script.addEventListener("error", () => reject(new Error("gis_unavailable")));
    if (!(existing instanceof HTMLScriptElement)) {
      script.src = GIS_SCRIPT_SRC;
      script.async = true;
      doc.head.appendChild(script);
    } else if (script.getAttribute("data-gis") === "ready") {
      succeed();
    }
  }).finally(() => {
    loading = null;
  });
  return loading;
}

export async function requestGoogleAuthCode(
  env: { VITE_GOOGLE_CLIENT_ID?: string } = import.meta.env,
  doc: Document = document,
  host: GoogleIdentityWindow = window as GoogleIdentityWindow,
): Promise<string> {
  const clientId = googleClientId(env);
  if (!clientId) {
    throw new Error("google_client_id_missing");
  }
  await loadGoogleIdentityServices(doc, host);
  const init = host.google?.accounts?.oauth2?.initCodeClient;
  if (!init) {
    throw new Error("gis_unavailable");
  }
  return new Promise((resolve, reject) => {
    const client = init({
      client_id: clientId,
      scope: GIS_SCOPE,
      ux_mode: "popup",
      callback: (response) => {
        const code = response.code?.trim() ?? "";
        if (code.length === 0) {
          reject(new Error("google_code_missing"));
          return;
        }
        resolve(code);
      },
      error_callback: () => reject(new Error("google_popup_failed")),
    });
    client.requestCode();
  });
}

export function resetGisLoader(): void {
  loading = null;
}
