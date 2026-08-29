import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider, useResolvedTheme, useThemeControls } from "./theme-provider";
import { ACCENT_BOOT_HEX, defaultThemeInput, THEME_CACHE_KEY } from "@/shared/lib/theme";
import { Button } from "@/shared/ui/button";

function Probe() {
  const theme = useResolvedTheme();
  return <span>{theme}</span>;
}

function Controls() {
  const { input, setInput } = useThemeControls();
  return (
    <div>
      <span>{`${input.theme}-${input.density}`}</span>
      <Button onClick={() => setInput({ theme: "dark" })}>{"dark-only"}</Button>
      <Button
        onClick={() =>
          setInput({
            theme: "light",
            density: "compact",
            sliders: { size: 1, weight: 0, lineHeight: 0, letterSpacing: 0 },
            adminOverrides: { "--text-primary": ACCENT_BOOT_HEX },
          })
        }
      >
        {"patch-all"}
      </Button>
    </div>
  );
}

function MissingControls() {
  useThemeControls();
  return null;
}

describe("ThemeProvider", () => {
  it("hydrates from the theme cache so a boot preference is not overwritten", () => {
    window.localStorage.setItem(
      THEME_CACHE_KEY,
      JSON.stringify({
        ...defaultThemeInput(),
        theme: "light",
      }),
    );
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByText("light")).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("applies a light theme without a system listener", () => {
    render(
      <ThemeProvider input={{ ...defaultThemeInput(), theme: "light" }}>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByText("light")).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("falls back without a provider and rejects missing controls", () => {
    render(<Probe />);
    expect(screen.getByText("dark")).toBeInTheDocument();
    expect(() => render(<MissingControls />)).toThrow("useThemeControls requires ThemeProvider");
  });

  it("syncs a new input prop and applies control patches", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ThemeProvider input={{ ...defaultThemeInput(), theme: "light" }}>
        <Controls />
      </ThemeProvider>,
    );
    expect(screen.getByText("light-comfortable")).toBeInTheDocument();
    rerender(
      <ThemeProvider input={{ ...defaultThemeInput(), theme: "dark", density: "compact" }}>
        <Controls />
      </ThemeProvider>,
    );
    expect(screen.getByText("dark-compact")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "dark-only" }));
    await user.click(screen.getByRole("button", { name: "patch-all" }));
    expect(screen.getByText("light-compact")).toBeInTheDocument();
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
