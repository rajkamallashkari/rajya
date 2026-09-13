import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/app/providers";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { CallLogItem } from "./call-log-item";
import { formatCallLogWhen } from "@/features/calls/model/log";
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
    member_count: 2,
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
  it("shows direct identity, datetime, shared duration content, and an accessible outgoing arrow", async () => {
    const user = userEvent.setup();
    const onOpen = renderRow(entry());
    const when = formatCallLogWhen(MESSAGE_STAMP, "en");
    expect(screen.getByText("Grace")).toBeInTheDocument();
    expect(screen.getByText("@grace")).toBeInTheDocument();
    expect(screen.getByText(when)).toBeInTheDocument();
    expect(screen.getByText("1m 12s")).toBeInTheDocument();
    expect(screen.getByRole("button").closest("[data-call-row]")).toHaveAttribute(
      "data-call-direction",
      "outgoing",
    );
    expect(screen.getByRole("button").closest("[data-call-row]")).toHaveAttribute(
      "data-call-kind",
      "audio",
    );
    expect(document.querySelector("[data-call-arrow=outgoing]")).toHaveClass(
      "text-[var(--status-success)]",
    );
    expect(
      screen.getByRole("img", { name: `${en.calls.direction_outgoing}: 1m 12s` }),
    ).toBeInTheDocument();
    expect(document.querySelector("[data-call-message='call_ended']")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: /Grace/ }));
    expect(onOpen).toHaveBeenCalled();
  });

  it("marks missed incoming rows and shares video-call danger content", () => {
    renderRow(
      entry({ initiator_account_id: 2, status: "missed", kind: "video", duration_seconds: null }),
    );
    expect(screen.getByText(en.calls.status_missed)).toBeInTheDocument();
    expect(screen.getByRole("button").closest("[data-call-row]")).toHaveAttribute(
      "data-call-status",
      "missed",
    );
    expect(screen.getByRole("button").closest("[data-call-row]")).toHaveAttribute(
      "data-call-kind",
      "video",
    );
    expect(document.querySelector("[data-call-arrow=incoming]")).toHaveClass(
      "text-[var(--status-danger)]",
    );
    expect(screen.getByText(en.messages.call.status.missed.received)).toHaveClass(
      "text-[var(--status-danger)]",
    );
    expect(
      screen.getByRole("img", {
        name: `${en.calls.direction_incoming}: ${en.messages.call.status.missed.received}`,
      }),
    ).toBeInTheDocument();
    expect(document.querySelector("[data-call-phase='missed'] svg")).not.toBeNull();
  });

  it("points an answered incoming call down-right in green", () => {
    renderRow(entry({ initiator_account_id: 2 }));
    const arrow = document.querySelector("[data-call-arrow=incoming]");
    expect(arrow).toHaveClass("text-[var(--status-success)]");
    expect(screen.getByText("1m 12s")).toBeInTheDocument();
  });

  it("falls back to untitled and declined copy", () => {
    renderRow(
      entry({
        title: null,
        peer: undefined,
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

  it("shows group identity with avatar, title, member count, and keeps row interaction", async () => {
    const user = userEvent.setup();
    const onOpen = renderRow(
      entry({
        avatar_url: "https://media.test/team.webp",
        conversation_kind: "group",
        member_count: 4,
        peer: undefined,
        title: "Design Team",
      }),
    );

    expect(screen.getByRole("img", { name: "Design Team" })).toBeInTheDocument();
    expect(screen.getByText("Design Team")).toBeInTheDocument();
    expect(screen.getByText("4 members")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Design Team/ }));
    expect(onOpen).toHaveBeenCalledOnce();
  });
});
