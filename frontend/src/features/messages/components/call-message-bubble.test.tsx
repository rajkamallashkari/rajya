import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/app/providers";
import { returnToCall } from "@/features/calls/lib";
import { resetCallStore, useCallStore } from "@/features/calls/store/call-store";
import { en } from "@/shared/lib/i18n/catalog";
import {
  CallMessageBubble,
  callMessageSide,
  callMetadata,
  resolveCallPhase,
} from "./call-message-bubble";

vi.mock("@/features/calls/lib", () => ({
  returnToCall: vi.fn(),
}));

describe("CallMessageBubble", () => {
  beforeEach(() => {
    resetCallStore();
    vi.mocked(returnToCall).mockReset();
  });

  it("renders an outgoing ended voice call with duration and accessible semantics", () => {
    render(
      <AppProviders>
        <CallMessageBubble
          createdAt="2026-01-01T12:00:00.000Z"
          event="call_ended"
          metadata={{
            duration_seconds: 72,
            initiated_at: "2026-01-01T11:58:48.000Z",
            initiator_account_id: 1,
            kind: "audio",
            status: "ended",
          }}
          role="first"
          senderName="Ada"
          showAvatar
          viewerId={1}
        />
      </AppProviders>,
    );

    const bubble = screen.getByRole("article", { name: `${en.messages.call.audio}: 1m 12s` });
    expect(bubble.querySelector("[data-call-message='call_ended']")).not.toBeNull();
    expect(bubble).toHaveAttribute("data-side", "sent");
    expect(bubble).toHaveClass("message-bubble", "bg-[var(--bubble-sent-fill)]", "rounded-br-none");
    expect(bubble.querySelectorAll("time")).toHaveLength(1);
    expect(bubble.querySelector("time")).toHaveAttribute("datetime", "2026-01-01T12:00:00.000Z");
    expect(screen.queryByText(en.messages.call.audio)).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Ada" })).toBeNull();
  });

  it("renders an incoming missed video call from event fallback", () => {
    render(
      <AppProviders>
        <CallMessageBubble
          createdAt="2026-01-01T12:00:00.000Z"
          event="call_missed"
          metadata={{ kind: "video" }}
          senderName="Grace"
          senderSrc="https://media.test/grace.webp"
          showAvatar
          viewerId={1}
        />
      </AppProviders>,
    );

    expect(
      screen.getByRole("article", {
        name: `${en.messages.call.video}: ${en.messages.call.status.missed.received}`,
      }),
    ).toHaveAttribute("data-side", "received");
    expect(screen.getByText("Missed")).toBeInTheDocument();
    expect(screen.queryByText(en.messages.call.video)).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Grace" })).toBeInTheDocument();
  });

  it("uses concise declined copy", () => {
    render(
      <AppProviders>
        <CallMessageBubble
          createdAt="2026-01-01T12:00:00.000Z"
          event="call_missed"
          metadata={{ kind: "audio", status: "declined" }}
          viewerId={1}
        />
      </AppProviders>,
    );

    expect(screen.getByText("Declined")).toBeInTheDocument();
    expect(screen.queryByText("You declined")).not.toBeInTheDocument();
  });

  it("restores only the matching ongoing call with mouse and keyboard", async () => {
    const user = userEvent.setup();
    useCallStore.setState({ callId: 44, minimized: true, status: "active" });
    const { rerender } = render(
      <AppProviders>
        <CallMessageBubble
          createdAt="2026-01-01T12:00:00.000Z"
          event="call_started"
          metadata={{
            call_id: 44,
            initiator_account_id: 1,
            kind: "audio",
            status: "active",
          }}
          viewerId={1}
        />
      </AppProviders>,
    );

    const ongoing = screen.getByRole("button", {
      name: `${en.messages.call.audio}: ${en.messages.call.status.active.sent}`,
    });
    await user.click(ongoing);
    expect(useCallStore.getState().minimized).toBe(false);

    useCallStore.setState({ minimized: true });
    fireEvent.keyDown(ongoing, { key: "Enter" });
    expect(useCallStore.getState().minimized).toBe(false);

    useCallStore.setState({ minimized: true });
    fireEvent.keyDown(ongoing, { key: " " });
    expect(useCallStore.getState().minimized).toBe(false);

    useCallStore.setState({ minimized: true });
    rerender(
      <AppProviders>
        <CallMessageBubble
          createdAt="2026-01-01T12:00:00.000Z"
          event="call_started"
          metadata={{ kind: "audio", status: "active" }}
          viewerId={1}
        />
      </AppProviders>,
    );
    expect(screen.queryByRole("button")).toBeNull();

    rerender(
      <AppProviders>
        <CallMessageBubble
          createdAt="2026-01-01T12:00:00.000Z"
          event="call_ended"
          metadata={{ call_id: 44, kind: "audio", status: "ended" }}
          viewerId={1}
        />
      </AppProviders>,
    );
    expect(screen.queryByRole("button")).toBeNull();
    const historical = screen.getByRole("article", {
      name: `${en.messages.call.audio}: ${en.messages.call.status.ended.received}`,
    });
    fireEvent.keyDown(historical, { key: "Enter" });
    await user.click(historical);
    expect(useCallStore.getState().minimized).toBe(true);
    expect(returnToCall).not.toHaveBeenCalled();
  });

  it("uses the existing return action for a matching recoverable ongoing call", async () => {
    const user = userEvent.setup();
    useCallStore.setState({
      stuckCall: { callType: "video", conversationId: 2, id: 45, status: "active" },
    });
    render(
      <AppProviders>
        <CallMessageBubble
          createdAt="2026-01-01T12:00:00.000Z"
          event="call_started"
          metadata={{ call_id: 45, kind: "video", status: "active" }}
          viewerId={1}
        />
      </AppProviders>,
    );

    await user.click(
      screen.getByRole("button", {
        name: `${en.messages.call.video}: ${en.messages.call.status.active.received}`,
      }),
    );
    expect(returnToCall).toHaveBeenCalledOnce();
  });

  it("resolves supported phases, busy state, sides, and invalid metadata", () => {
    expect(resolveCallPhase({ busy: true, status: "missed" }, "call_missed")).toBe("busy");
    expect(resolveCallPhase({ busy: true, status: "declined" }, "call_missed")).toBe("busy");
    expect(resolveCallPhase({ status: "active" }, "call_started")).toBe("active");
    expect(resolveCallPhase({ status: "declined" }, "call_missed")).toBe("declined");
    expect(resolveCallPhase({ status: "ringing" }, "call_started")).toBe("ringing");
    expect(resolveCallPhase({}, "call_started")).toBe("ringing");
    expect(resolveCallPhase({}, "call_ended")).toBe("ended");
    expect(callMessageSide({ initiator_account_id: 4 }, 4)).toBe("sent");
    expect(callMessageSide({}, 4)).toBe("received");
    expect(callMetadata(null)).toEqual({});
  });
});
