import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/app/providers";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { CallLogItem } from "./call-log-item";
import { formatCallDuration, formatCallLogWhen } from "@/features/calls/model/log";
import { MESSAGE_STAMP, VIEWER } from "@/shared/lib/api/msw/messaging-store";
import { en } from "@/shared/lib/i18n/catalog";
import type { CallLogEntry } from "@/features/calls/api/http";

function entry(overrides: Partial<CallLogEntry> = {}): CallLogEntry {
  return {
    id: 11,
    conversation_id: 1,
    conversation_kind: "direct",
    initiator_account_id: VIEWER.id,
    kind: "audio",
    status: "ended",
    duration_seconds: 72,
    created_at: MESSAGE_STAMP,
    title: "Grace",
    peer: { id: 2, username: "grace", display_name: "Grace", kind: "human" },
    participants: [],
    ...overrides,
  };
}

function renderRow(row: CallLogEntry, onOpen = vi.fn(), accountId: number | null = VIEWER.id) {
  useAccountsStore.setState({ activeAccountId: accountId });
  render(
    <AppProviders>
      <CallLogItem onOpen={onOpen} row={row} />
    </AppProviders>,
  );
  return onOpen;
}

describe("CallLogItem", () => {
  it("shows datetime, duration, outgoing arrow, and a voice icon", async () => {
    const user = userEvent.setup();
    const onOpen = renderRow(entry());
    const when = formatCallLogWhen(MESSAGE_STAMP, "en");
    expect(screen.getByText("Grace")).toBeInTheDocument();
    expect(screen.getByText(when)).toBeInTheDocument();
    expect(screen.getByText(formatCallDuration(72))).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute("data-call-direction", "outgoing");
    expect(screen.getByRole("button")).toHaveAttribute("data-call-kind", "audio");
    expect(document.querySelector("[data-call-arrow=outgoing]")).toHaveClass(
      "text-[var(--status-success)]",
    );
    await user.click(screen.getByRole("button", { name: /Grace/ }));
    expect(onOpen).toHaveBeenCalled();
  });

  it("marks missed and declined incoming rows and uses a video icon", () => {
    renderRow(
      entry({ initiator_account_id: 2, status: "missed", kind: "video", duration_seconds: null }),
    );
    expect(screen.getByText(en.calls.status_missed)).toHaveClass("truncate");
    expect(screen.getByRole("button")).toHaveAttribute("data-call-status", "missed");
    expect(screen.getByRole("button")).toHaveAttribute("data-call-kind", "video");
    expect(document.querySelector("[data-call-arrow=incoming]")).toHaveClass(
      "text-[var(--status-danger)]",
    );
    expect(screen.getByText(en.calls.status_missed).parentElement).toHaveClass(
      "text-[var(--status-danger)]",
    );
  });

  it("points an answered incoming call down-right in green", () => {
    renderRow(entry({ initiator_account_id: 2 }));
    const arrow = document.querySelector("[data-call-arrow=incoming]");
    expect(arrow).toHaveClass("text-[var(--status-success)]");
    expect(screen.getByText(formatCallDuration(72))).toBeInTheDocument();
  });

  it("falls back to untitled and declined copy", () => {
    renderRow(
      entry({
        title: null,
        initiator_account_id: 2,
        status: "declined",
        duration_seconds: null,
      }),
      vi.fn(),
      null,
    );
    expect(screen.getByText(en.conversations.untitled)).toBeInTheDocument();
    expect(screen.getByText(en.calls.status_declined)).toBeInTheDocument();
    expect(document.querySelector("[data-call-arrow=incoming]")).toHaveClass(
      "text-[var(--status-danger)]",
    );
  });
});
