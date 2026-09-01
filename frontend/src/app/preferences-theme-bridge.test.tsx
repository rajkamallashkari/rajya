import { describe, expect, it } from "vitest";
import { PreferencesThemeBridge } from "./preferences-theme-bridge";
import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/app/theme-provider";
import { defaultThemeInput } from "@/shared/lib/theme";

describe("PreferencesThemeBridge", () => {
  it("hydrates applyTheme from preferences and catalogues", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <ThemeProvider input={{ ...defaultThemeInput(), theme: "light" }}>
          <PreferencesThemeBridge>
            <p>{"ready"}</p>
          </PreferencesThemeBridge>
        </ThemeProvider>
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(document.documentElement.dataset.wallpaper).toBe("none");
    });
  });

  it("applies the dark palette overlay when the resolved theme is dark", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <ThemeProvider input={{ ...defaultThemeInput(), theme: "dark" }}>
          <PreferencesThemeBridge>
            <p>{"ready"}</p>
          </PreferencesThemeBridge>
        </ThemeProvider>
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });
});
