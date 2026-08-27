import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { AppShell } from "@/app/shell";
import { useShellStore } from "@/features/settings/store/shell-store";

describe("AppShell", () => {
  it("renders brand, gallery link and list slot", () => {
    useShellStore.setState({ mobileNavOpen: true });
    render(
      <AppProviders>
        <MemoryRouter>
          <AppShell />
        </MemoryRouter>
      </AppProviders>,
    );
    expect(screen.getByAltText("Rajya")).toBeInTheDocument();
    expect(screen.getByText("Chat")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Gallery" })).toHaveAttribute("href", "/dev/gallery");
    expect(document.querySelector("[data-mobile-nav='open']")).not.toBeNull();
    useShellStore.setState({ mobileNavOpen: false });
  });
});
