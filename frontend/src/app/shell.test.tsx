import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { AppShell } from "@/app/shell";
import { useShellStore } from "@/features/settings/store/shell-store";

describe("AppShell", () => {
  it("renders brand and list slot", () => {
    useShellStore.setState({ mobileNavOpen: true });
    render(
      <AppProviders>
        <AppShell />
      </AppProviders>,
    );
    expect(screen.getByAltText("Rajya")).toBeInTheDocument();
    expect(screen.getByText("Chat")).toBeInTheDocument();
    expect(document.querySelector("[data-mobile-nav='open']")).not.toBeNull();
    useShellStore.setState({ mobileNavOpen: false });
  });
});
