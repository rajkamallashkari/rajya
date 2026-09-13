import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QrSheet } from "./qr-sheet";
import { ReportSheet } from "./report-sheet";
import { REPORT_SUBJECTS } from "@/features/conversations/model/report";
import { en } from "@/shared/lib/i18n/catalog";

describe("QrSheet", () => {
  it("encodes the payload with the real encoder, then copies", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onCopy = vi.fn();
    render(
      <QrSheet
        onCopy={onCopy}
        onOpenChange={vi.fn()}
        open
        payload="https://rajya.pages.dev/u/ada"
      />,
    );
    expect(document.querySelector("[data-qr-code]")).not.toBeNull();
    expect(screen.getByRole("status", { name: en.qr.loading })).toBeInTheDocument();

    const image = await screen.findByRole("img", { name: en.qr.image });
    expect(image).toHaveAttribute("src", expect.stringContaining("data:image/svg+xml"));
    expect(decodeURIComponent(image.getAttribute("src") ?? "")).toContain("<svg xmlns=");
    expect(screen.queryByRole("status", { name: en.qr.loading })).toBeNull();
    expect(REPORT_SUBJECTS).toContain("message");

    await user.click(screen.getByRole("button", { name: en.qr.copy }));
    expect(onCopy).toHaveBeenCalled();
  });

  it("shows an error when the payload cannot be encoded", async () => {
    render(<QrSheet onOpenChange={vi.fn()} open payload={"x".repeat(4000)} />);
    expect(await screen.findByText(en.qr.error)).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: en.qr.image })).toBeNull();
    expect(screen.queryByRole("button", { name: en.qr.copy })).toBeNull();
  });

  it("skips encoding while closed or without a payload", async () => {
    const { unmount } = render(
      <QrSheet onOpenChange={vi.fn()} open={false} payload="https://rajya.pages.dev" />,
    );
    expect(document.querySelector("[data-qr-code]")).toBeNull();
    unmount();

    render(<QrSheet onOpenChange={vi.fn()} open payload="" />);
    expect(screen.getByRole("status", { name: en.qr.loading })).toBeInTheDocument();
    await Promise.resolve();
    expect(screen.queryByRole("img", { name: en.qr.image })).toBeNull();
  });

  it("drops an in-flight encode after unmount", async () => {
    const { unmount } = render(
      <QrSheet onOpenChange={vi.fn()} open payload="https://rajya.pages.dev/u/grace" />,
    );
    unmount();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByRole("img", { name: en.qr.image })).toBeNull();
  });
});

describe("ReportSheet", () => {
  it("submits a reason and handles an empty list", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onSubmit = vi.fn();
    const { rerender } = render(
      <ReportSheet
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
        open
        reasons={[
          { id: "spam", label: "Spam" },
          { id: "abuse", label: "Abuse" },
        ]}
        subjectType="message"
      />,
    );
    await user.click(screen.getByRole("radio", { name: "Abuse" }));
    await user.type(screen.getByPlaceholderText(en.report.details_placeholder), "note");
    await user.click(screen.getByRole("button", { name: en.report.submit }));
    expect(onSubmit).toHaveBeenCalledWith({ details: "note", reasonId: "abuse" });
    rerender(
      <ReportSheet
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
        open
        reasons={[{ id: "other", label: "Other" }]}
        subjectType="account"
      />,
    );
    expect(screen.getByRole("radio", { name: "Other" })).toBeChecked();
    rerender(
      <ReportSheet
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
        open
        reasons={[]}
        subjectType="bot"
      />,
    );
    expect(screen.getByText(en.report.no_reasons)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: en.report.submit })).toBeDisabled();
  });
});
