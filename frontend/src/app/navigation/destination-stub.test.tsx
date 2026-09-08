import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DestinationStub } from "./destination-stub";
import { AppProviders } from "@/app/providers";
import { en } from "@/shared/lib/i18n/catalog";

describe("DestinationStub", () => {
  it("renders the calls placeholder", () => {
    render(
      <AppProviders>
        <DestinationStub destination="calls" />
      </AppProviders>,
    );
    expect(screen.getByRole("region", { name: en.shell.calls })).toHaveAttribute(
      "data-destination",
      "calls",
    );
    expect(screen.getByText(en.shell.calls_stub)).toBeInTheDocument();
  });

  it("renders the profile placeholder", () => {
    render(
      <AppProviders>
        <DestinationStub destination="profile" />
      </AppProviders>,
    );
    expect(screen.getByRole("region", { name: en.shell.profile })).toHaveAttribute(
      "data-destination",
      "profile",
    );
    expect(screen.getByText(en.shell.profile_stub)).toBeInTheDocument();
  });
});
