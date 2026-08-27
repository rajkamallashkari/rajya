import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider, useResolvedTheme } from "./theme-provider";
import { defaultThemeInput } from "@/shared/lib/theme";

function Probe() {
  const theme = useResolvedTheme();
  return <span>{theme}</span>;
}

describe("ThemeProvider", () => {
  it("applies a light theme without a system listener", () => {
    render(
      <ThemeProvider input={{ ...defaultThemeInput(), theme: "light" }}>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByText("light")).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("re-applies when the system preference changes", () => {
    const listeners = new Set<(event: Event) => void>();
    const media = {
      matches: true,
      media: "(prefers-color-scheme: dark)",
      addEventListener: (_: string, listener: (event: Event) => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: (event: Event) => void) =>
        listeners.delete(listener),
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
      onchange: null,
    };
    vi.spyOn(window, "matchMedia").mockImplementation(() => media as unknown as MediaQueryList);
    const { unmount } = render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByText("dark")).toBeInTheDocument();
    media.matches = false;
    listeners.forEach((listener) => listener(new Event("change")));
    unmount();
    expect(listeners.size).toBe(0);
    vi.restoreAllMocks();
  });
});
