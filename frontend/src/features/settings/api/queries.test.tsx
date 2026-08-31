import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { setAccessSession } from "@/features/auth/model/access-session";
import {
  useAccentConfigs,
  useFontConfigs,
  usePreferences,
  useUpdatePreferences,
} from "./queries";
import { Button } from "@/shared/ui/button";
import { testSession } from "@/test/access-session";
import { server } from "@/test/msw";

function PrefsHarness() {
  const prefs = usePreferences();
  const fonts = useFontConfigs();
  const accents = useAccentConfigs();
  const update = useUpdatePreferences();
  return (
    <div>
      <p data-theme="">{String((prefs.data?.data as { appearance?: { theme?: string } } | undefined)?.appearance?.theme ?? "")}</p>
      <p data-fonts="">{fonts.data?.font_configs.length ?? 0}</p>
      <p data-accents="">{accents.data?.accent_configs.length ?? 0}</p>
      <Button onClick={() => update.mutate({ appearance: { theme: "dark" } })} type="button">
        dark
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
    });
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
