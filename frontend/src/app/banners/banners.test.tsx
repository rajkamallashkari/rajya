import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ImpersonationBanner } from "./impersonation-banner";
import { OfflineBanner } from "./offline-banner";
import { en } from "@/shared/lib/i18n/catalog";

describe("banners", () => {
  it("hides the offline banner while online and shows it when forced or offline", () => {
    render(<OfflineBanner />);
    expect(document.querySelector("[data-offline-banner]")).toBeNull();
    render(<OfflineBanner force />);
    expect(screen.getByRole("status")).toHaveTextContent(en.offline.banner);
    const original = navigator.onLine;
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    window.dispatchEvent(new Event("offline"));
    render(<OfflineBanner />);
    expect(screen.getAllByRole("status")).not.toHaveLength(0);
    Object.defineProperty(navigator, "onLine", { configurable: true, value: original });
    window.dispatchEvent(new Event("online"));
  });

  it("renders the impersonation banner and exits", async () => {
    const user = userEvent.setup();
    const onExit = vi.fn();
    render(<ImpersonationBanner name="Ada" onExit={onExit} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Viewing as Ada");
    await user.click(screen.getByRole("button", { name: en.impersonation.exit }));
    expect(onExit).toHaveBeenCalled();
  });
});
