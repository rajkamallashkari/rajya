import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/app/providers";
import { setAccessSession } from "@/features/auth/model/access-session";
import {
  useAccentConfigs,
  useContactNicknames,
  useCreateExportJob,
  useDestroyContactNickname,
  useDeviceSessions,
  useDownloadExportJob,
  useExportJobs,
  useFontConfigs,
  usePreferences,
  useRevokeDeviceSession,
  useRevokeOtherDeviceSessions,
  useUpdatePreferences,
  useUpsertContactNickname,
} from "./queries";
import { Button } from "@/shared/ui/button";
import { testSession } from "@/test/access-session";
import { server } from "@/test/msw";

function PrefsHarness() {
  const prefs = usePreferences();
  const fonts = useFontConfigs();
  const accents = useAccentConfigs();
  const update = useUpdatePreferences();
  const sessions = useDeviceSessions();
  const nicknames = useContactNicknames();
  const exports = useExportJobs();
  const revoke = useRevokeDeviceSession();
  const revokeOthers = useRevokeOtherDeviceSessions();
  const upsert = useUpsertContactNickname();
  const destroyNickname = useDestroyContactNickname();
  const createExport = useCreateExportJob();
  const download = useDownloadExportJob();
  return (
    <div>
      <p data-theme="">{String((prefs.data?.data as { appearance?: { theme?: string } } | undefined)?.appearance?.theme ?? "")}</p>
      <p data-fonts="">{fonts.data?.font_configs.length ?? 0}</p>
      <p data-accents="">{accents.data?.accent_configs.length ?? 0}</p>
      <p data-sessions="">{sessions.data?.sessions.length ?? 0}</p>
      <p data-nicknames="">{nicknames.data?.nicknames.length ?? 0}</p>
      <p data-exports="">{exports.data?.export_jobs.length ?? 0}</p>
      <Button onClick={() => update.mutate({ appearance: { theme: "dark" } })} type="button">
        dark
      </Button>
      <Button onClick={() => revoke.mutate(2)} type="button">
        revoke
      </Button>
      <Button onClick={() => revokeOthers.mutate()} type="button">
        revoke-others
      </Button>
      <Button onClick={() => upsert.mutate({ accountId: 2, nickname: "Key" })} type="button">
        nick
      </Button>
      <Button onClick={() => destroyNickname.mutate(2)} type="button">
        unnick
      </Button>
      <Button onClick={() => createExport.mutate({ format: "json" })} type="button">
        export
      </Button>
      <Button onClick={() => download.mutate(1)} type="button">
        download
      </Button>
    </div>
  );
}

describe("settings queries", () => {
  it("loads catalogues and patches preferences", async () => {
    const user = userEvent.setup();
    setAccessSession(testSession());
    render(
      <AppProviders>
        <PrefsHarness />
      </AppProviders>,
    );
    await waitFor(() => {
      expect(screen.getByText("system")).toBeInTheDocument();
      expect(document.querySelector("[data-fonts]")?.textContent).toBe("2");
      expect(document.querySelector("[data-accents]")?.textContent).toBe("2");
      expect(document.querySelector("[data-sessions]")?.textContent).toBe("2");
      expect(document.querySelector("[data-nicknames]")?.textContent).toBe("1");
      expect(document.querySelector("[data-exports]")?.textContent).toBe("1");
    });
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    await user.click(screen.getByRole("button", { name: "dark" }));
    await user.click(screen.getByRole("button", { name: "revoke" }));
    await user.click(screen.getByRole("button", { name: "revoke-others" }));
    await user.click(screen.getByRole("button", { name: "nick" }));
    await user.click(screen.getByRole("button", { name: "unnick" }));
    await user.click(screen.getByRole("button", { name: "export" }));
    await user.click(screen.getByRole("button", { name: "download" }));
    expect(open).toHaveBeenCalled();
    open.mockRestore();
    await user.click(screen.getByRole("button", { name: "dark" }));
    await waitFor(() => {
      expect(document.querySelector("[data-theme]")?.textContent).toBe("dark");
    });
  });

  it("rolls preference patches back when they fail", async () => {
    const user = userEvent.setup();
    setAccessSession(testSession());
    server.use(
      http.patch("*/api/v1/preferences", () =>
        HttpResponse.json(
          { error: { code: "fail", message: "fail", details: {} } },
          { status: 500 },
        ),
      ),
    );
    render(
      <AppProviders>
        <PrefsHarness />
      </AppProviders>,
    );
    await waitFor(() => {
      expect(screen.getByText("system")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "dark" }));
    await waitFor(() => {
      expect(screen.getByText("system")).toBeInTheDocument();
    });
  });

  it("optimistically patches from registry defaults when the cache is empty", async () => {
    const user = userEvent.setup();
    setAccessSession(testSession());
    server.use(
      http.all("*/api/v1/preferences", async () => {
        await delay(400);
        return HttpResponse.json({
          data: { appearance: { theme: "system" } },
          updated_at: null,
        });
      }),
    );
    render(
      <AppProviders>
        <PrefsHarness />
      </AppProviders>,
    );
    await user.click(screen.getByRole("button", { name: "dark" }));
    await waitFor(() => {
      expect(document.querySelector("[data-theme]")?.textContent).toBe("dark");
    });
  });
});
