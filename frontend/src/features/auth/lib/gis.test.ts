import { afterEach, describe, expect, it, vi } from "vitest";
import { GIS_SCRIPT_SRC } from "@/features/auth/model/gate-config";
import {
  gisReady,
  loadGoogleIdentityServices,
  requestGoogleAuthCode,
  resetGisLoader,
  type GoogleIdentityWindow,
} from "./gis";

function hostWithClient(
  initCodeClient: NonNullable<
    NonNullable<NonNullable<GoogleIdentityWindow["google"]>["accounts"]>["oauth2"]
  >["initCodeClient"],
): GoogleIdentityWindow {
  return { google: { accounts: { oauth2: { initCodeClient } } } };
}

describe("Google Identity Services", () => {
  afterEach(() => {
    resetGisLoader();
    document.head.replaceChildren();
  });

  it("skips the script when GIS is already present", async () => {
    const host = hostWithClient(() => ({ requestCode: () => undefined }));
    expect(gisReady(host)).toBe(true);
    await loadGoogleIdentityServices(document, host);
    expect(document.querySelector(`script[src="${GIS_SCRIPT_SRC}"]`)).toBeNull();
  });

  it("loads the GIS script and resolves once the client appears", async () => {
    const host: GoogleIdentityWindow = {};
    const pending = loadGoogleIdentityServices(document, host);
    const script = document.querySelector(`script[src="${GIS_SCRIPT_SRC}"]`);
    expect(script).toBeInstanceOf(HTMLScriptElement);
    host.google = {
      accounts: { oauth2: { initCodeClient: () => ({ requestCode: () => undefined }) } },
    };
    script?.dispatchEvent(new Event("load"));
    await pending;
    const again = loadGoogleIdentityServices(document, host);
    await again;
  });

  it("reuses an in-flight load and rejects a failed or empty script", async () => {
    const host: GoogleIdentityWindow = {};
    const first = loadGoogleIdentityServices(document, host);
    const second = loadGoogleIdentityServices(document, host);
    document.querySelector(`script[src="${GIS_SCRIPT_SRC}"]`)?.dispatchEvent(new Event("error"));
    await expect(first).rejects.toThrow("gis_unavailable");
    await expect(second).rejects.toThrow("gis_unavailable");

    const empty = loadGoogleIdentityServices(document, {});
    document.querySelector(`script[src="${GIS_SCRIPT_SRC}"]`)?.dispatchEvent(new Event("load"));
    await expect(empty).resolves.toBeUndefined();
  });

  it("waits on an existing script tag until it is marked ready", async () => {
    const script = document.createElement("script");
    script.src = GIS_SCRIPT_SRC;
    script.setAttribute("data-gis", "ready");
    document.head.appendChild(script);
    await expect(loadGoogleIdentityServices(document, {})).resolves.toBeUndefined();
  });

  it("opens a GIS popup and returns the auth code", async () => {
    const initCodeClient = vi.fn(
      (config: {
        callback: (response: { code?: string }) => void;
        error_callback?: () => void;
      }) => ({
        requestCode: () => config.callback({ code: " gis-code " }),
      }),
    );
    await expect(
      requestGoogleAuthCode(
        { VITE_GOOGLE_CLIENT_ID: "client.apps.googleusercontent.com" },
        document,
        hostWithClient(initCodeClient),
      ),
    ).resolves.toBe("gis-code");
    expect(initCodeClient).toHaveBeenCalled();
  });

  it("rejects a missing client id, missing code, popup error, and unavailable GIS", async () => {
    await expect(requestGoogleAuthCode({}, document, {})).rejects.toThrow(
      "google_client_id_missing",
    );

    const missingCode = vi.fn((config: { callback: (response: { code?: string }) => void }) => ({
      requestCode: () => config.callback({}),
    }));
    await expect(
      requestGoogleAuthCode(
        { VITE_GOOGLE_CLIENT_ID: "client" },
        document,
        hostWithClient(missingCode),
      ),
    ).rejects.toThrow("google_code_missing");

    const popupFailed = vi.fn((config: { error_callback?: () => void }) => ({
      requestCode: () => config.error_callback?.(),
    }));
    await expect(
      requestGoogleAuthCode(
        { VITE_GOOGLE_CLIENT_ID: "client" },
        document,
        hostWithClient(popupFailed),
      ),
    ).rejects.toThrow("google_popup_failed");

    const leftover = document.createElement("script");
    leftover.src = GIS_SCRIPT_SRC;
    leftover.setAttribute("data-gis", "ready");
    document.head.appendChild(leftover);
    await expect(
      requestGoogleAuthCode({ VITE_GOOGLE_CLIENT_ID: "client" }, document, {
        google: { accounts: { oauth2: undefined } },
      }),
    ).rejects.toThrow("gis_unavailable");
  });
});
