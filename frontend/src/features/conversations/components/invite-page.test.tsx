import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { InvitePage, inviteActionLabel } from "./invite-page";
import { AppProviders } from "@/app/providers";
import { setAccessSession } from "@/features/auth/model/access-session";
import { canManageInvites, inviteUrl, profileUrl } from "@/features/conversations/model/links";
import { en } from "@/shared/lib/i18n/catalog";
import { testSession } from "@/test/access-session";
import { server } from "@/test/msw";

function renderInvite(path: string) {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<InvitePage />} path="/invite/:token" />
          <Route element={<InvitePage />} path="/invite" />
          <Route element={<div data-home="" />} path="/" />
          <Route element={<div data-chat="" />} path="/c/:conversationId" />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  );
}

describe("invite links", () => {
  it("builds invite and profile URLs and gates invite management", () => {
    expect(inviteUrl("https://rajya.pages.dev", "ab/c")).toBe("https://rajya.pages.dev/invite/ab%2Fc");
    expect(profileUrl("https://rajya.pages.dev", "ada")).toBe("https://rajya.pages.dev/u/ada");
    expect(canManageInvites("group", "owner")).toBe(true);
    expect(canManageInvites("channel", "admin")).toBe(true);
    expect(canManageInvites("group", "member")).toBe(false);
    expect(canManageInvites("direct", "owner")).toBe(false);
    expect(canManageInvites(null, "admin")).toBe(true);
  });

  it("picks the invite action label", () => {
    expect(
      inviteActionLabel({
        already_member: true,
        kind: "group",
        pending_request: false,
        requires_approval: true,
      }),
    ).toBe("open");
    expect(
      inviteActionLabel({
        already_member: false,
        kind: "group",
        pending_request: true,
        requires_approval: true,
      }),
    ).toBe("pending");
    expect(
      inviteActionLabel({
        already_member: false,
        kind: "group",
        pending_request: false,
        requires_approval: true,
      }),
    ).toBe("request");
    expect(
      inviteActionLabel({
        already_member: false,
        kind: "channel",
        pending_request: false,
        requires_approval: false,
      }),
    ).toBe("follow");
    expect(
      inviteActionLabel({
        already_member: false,
        kind: "group",
        pending_request: false,
        requires_approval: false,
      }),
    ).toBe("join");
  });
});

describe("InvitePage", () => {
  it("shows invalid copy for a missing token or unknown invite", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderInvite("/invite");
    expect(screen.getByText(en.invites.invalid_title)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.invites.go_home }));
    expect(document.querySelector("[data-home]")).not.toBeNull();
    renderInvite("/invite/gone");
    expect(await screen.findByText(en.invites.invalid)).toBeInTheDocument();
  });

  it("shows a loading skeleton then a channel invite", async () => {
    server.use(
      http.get("*/api/v1/invites/:token", async () => {
        await delay(50);
        return HttpResponse.json({
          already_member: false,
          avatar_url: null,
          conversation_id: 2,
          kind: "channel",
          member_count: 3,
          pending_request: false,
          requires_approval: false,
          title: "News",
          usable: true,
        });
      }),
    );
    setAccessSession(testSession());
    renderInvite("/invite/channel");
    expect(await screen.findByRole("status")).toBeInTheDocument();
    expect(await screen.findByText(en.invites.channel)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: en.invites.follow })).toBeInTheDocument();
  });

  it("asks unsigned visitors to sign in", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderInvite("/invite/open");
    expect(await screen.findByRole("button", { name: en.invites.sign_in })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.invites.sign_in }));
    expect(document.querySelector("[data-home]")).not.toBeNull();
  });

  it("opens an existing membership without joining", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    setAccessSession(testSession());
    renderInvite("/invite/member");
    await user.click(await screen.findByRole("button", { name: en.invites.open }));
    expect(document.querySelector("[data-chat]")).not.toBeNull();
  });

  it("joins a group and navigates to the conversation", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    setAccessSession(testSession());
    renderInvite("/invite/open");
    await user.click(await screen.findByRole("button", { name: en.invites.join }));
    await waitFor(() => {
      expect(document.querySelector("[data-chat]")).not.toBeNull();
    });
  });

  it("joins using the preview conversation id when the join payload has no conversation", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    setAccessSession(testSession());
    renderInvite("/invite/bare");
    await user.click(await screen.findByRole("button", { name: en.invites.join }));
    await waitFor(() => {
      expect(document.querySelector("[data-chat]")).not.toBeNull();
    });
  });

  it("stays on the page when join succeeds without a conversation id", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    setAccessSession(testSession());
    renderInvite("/invite/orphan");
    await user.click(await screen.findByRole("button", { name: en.invites.join }));
    expect(await screen.findByText("Team")).toBeInTheDocument();
    expect(document.querySelector("[data-chat]")).toBeNull();
  });

  it("submits a join request and shows the pending notice", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    setAccessSession(testSession());
    renderInvite("/invite/approval");
    expect(await screen.findByText(en.invites.approval_notice)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.invites.request }));
    expect(await screen.findByText(en.invites.pending_notice)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: en.invites.pending })).toBeDisabled();
  });

  it("keeps a pending request disabled", async () => {
    setAccessSession(testSession());
    renderInvite("/invite/pending");
    expect(await screen.findByText(en.invites.pending_notice)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: en.invites.pending })).toBeDisabled();
  });

  it("shows inactive copy for a spent invite", async () => {
    renderInvite("/invite/spent");
    expect(await screen.findByText(en.invites.inactive)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: en.invites.join })).toBeNull();
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    await user.click(screen.getByRole("button", { name: en.invites.go_home }));
    expect(document.querySelector("[data-home]")).not.toBeNull();
  });

  it("shows a join error", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    setAccessSession(testSession());
    renderInvite("/invite/fail");
    await user.click(await screen.findByRole("button", { name: en.invites.join }));
    expect(await screen.findByText(en.invites.join_failed)).toBeInTheDocument();
  });

  it("shows joining while the request is in flight", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    setAccessSession(testSession());
    server.use(
      http.post("*/api/v1/invites/:token/join", async () => {
        await delay(80);
        return HttpResponse.json({ status: "joined", conversation: { id: 2 } });
      }),
    );
    renderInvite("/invite/open");
    await user.click(await screen.findByRole("button", { name: en.invites.join }));
    expect(await screen.findByText(en.invites.joining)).toBeInTheDocument();
  });

  it("falls back to the untitled title", async () => {
    setAccessSession(testSession());
    renderInvite("/invite/untitled");
    expect(await screen.findByText(en.conversations.untitled)).toBeInTheDocument();
  });

  it("joins when already a member without a conversation id", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    setAccessSession(testSession());
    renderInvite("/invite/member-bare");
    await user.click(await screen.findByRole("button", { name: en.invites.open }));
    expect(await screen.findByText("Team")).toBeInTheDocument();
  });
});
