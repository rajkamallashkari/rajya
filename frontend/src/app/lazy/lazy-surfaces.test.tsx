import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { CallHost } from "./call-host";
import { SettingsLayer } from "./settings-layer";
import { AppProviders } from "@/app/providers";
import { AdminRoute } from "@/app/lazy/admin-tree";

describe("lazy surfaces", () => {
  it("mounts call, settings, and admin shells", async () => {
    const { container: calls } = render(
      <AppProviders>
        <CallHost />
      </AppProviders>,
    );
    await waitFor(() => {
      expect(document.querySelector("[data-call-overlays]")).not.toBeNull();
    });
    expect(calls).toBeTruthy();
    render(
      <AppProviders>
        <MemoryRouter>
          <SettingsLayer />
        </MemoryRouter>
      </AppProviders>,
    );
    await waitFor(() => {
      expect(document.querySelector("[data-settings-panel],[data-chunk-fallback]")).not.toBeNull();
    });
    const { container: admin } = render(
      <AppProviders>
        <MemoryRouter>
          <AdminRoute />
        </MemoryRouter>
      </AppProviders>,
    );
    expect(admin).toBeTruthy();
  });
});
