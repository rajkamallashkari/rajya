import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QrSheet } from "./qr-sheet";
import { ReportSheet } from "./report-sheet";
import {
  isFinderCell,
  isReservedQrCell,
  qrModules,
  QR_SIZE,
} from "@/features/conversations/model/qr";
import { REPORT_SUBJECTS } from "@/features/conversations/model/report";
import { en } from "@/shared/lib/i18n/catalog";

describe("qr model", () => {
  it("places finders and encodes payload", () => {
    expect(isFinderCell(0, 0)).toBe(true);
    expect(isFinderCell(QR_SIZE - 1, 0)).toBe(true);
    expect(isFinderCell(0, QR_SIZE - 1)).toBe(true);
    expect(isFinderCell(10, 10)).toBe(false);
    expect(isReservedQrCell(6, 10)).toBe(true);
    const empty = qrModules("");
    const filled = qrModules("rajya");
    expect(empty).toHaveLength(QR_SIZE);
    expect(filled.join()).not.toBe(empty.join());
    expect(qrModules("rajya").join()).toBe(filled.join());
    expect(REPORT_SUBJECTS).toContain("message");
  });
});

describe("QrSheet", () => {
  it("renders modules and copies", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onCopy = vi.fn();
    render(
      <QrSheet onCopy={onCopy} onOpenChange={vi.fn()} open payload="https://rajya.pages.dev" />,
    );
    expect(document.querySelector("[data-qr-grid]")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: en.qr.copy }));
    expect(onCopy).toHaveBeenCalled();
    render(<QrSheet onOpenChange={vi.fn()} open payload="x" />);
    expect(screen.queryByRole("button", { name: en.qr.copy })).toBeNull();
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
