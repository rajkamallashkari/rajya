import { type ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/app/providers";
import { setAccessSession } from "@/features/auth/model/access-session";
import { ChatsPanel } from "./chats-panel";
import { SettingsPanel } from "./settings-panel";
import { en } from "@/shared/lib/i18n/catalog";
import { server } from "@/test/msw";
import { testSession } from "@/test/access-session";

function wrap(ui: ReactNode) {
  return (
    <AppProviders>
      <MemoryRouter>{ui}</MemoryRouter>
    </AppProviders>
  );
}

const readyJob = {
  created_at: "2026-01-01T12:00:00.000Z",
  expires_at: "2099-01-01T00:00:00.000Z",
  format: "json" as const,
  id: 1,
  include_media: false,
  status: "ready" as const,
};

describe("ChatsPanel", () => {
  it("writes chat preferences and manages saved replies", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(wrap(<ChatsPanel />));
    const transcription = await screen.findByRole("switch", { name: en.settings.transcription });
    await user.click(transcription);
    await user.click(screen.getByRole("switch", { name: en.settings.link_previews }));
    await user.click(screen.getByRole("button", { name: en.settings.saved_replies.add }));
    const shortcuts = screen.getAllByRole("textbox", { name: en.settings.saved_replies.shortcut });
    const bodies = screen.getAllByRole("textbox", { name: en.settings.saved_replies.body });
    await user.type(shortcuts[0]!, "/brb");
    await user.type(bodies[0]!, "Be right back");
    await user.click(screen.getByRole("button", { name: en.settings.saved_replies.add }));
    shortcuts[1]!.focus();
    await user.tab();
    await user.clear(shortcuts[1]!);
    await user.type(shortcuts[1]!, "/later");
    await user.tab();
    await user.clear(bodies[1]!);
    await user.type(bodies[1]!, "Later");
    await user.tab();
    await user.click(screen.getByRole("button", { name: en.settings.saved_replies.delete }));
  });

  it("adds, updates, and removes nicknames", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    setAccessSession(testSession());
    render(wrap(<ChatsPanel />));
    expect(await screen.findByText("Ada")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.settings.nicknames.add }));
    await user.type(screen.getByPlaceholderText(en.settings.nicknames.search), "Ad");
    expect(await screen.findByRole("button", { name: "Ada Lovelace" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ada Lovelace" }));
    await user.type(screen.getByPlaceholderText(en.settings.nicknames.nickname), "Key");
    await user.click(screen.getByRole("button", { name: en.settings.nicknames.add }));
    const nicknameFields = screen.getAllByRole("textbox", { name: en.settings.nicknames.nickname });
    nicknameFields[1]!.focus();
    await user.tab();
    await user.clear(nicknameFields[1]!);
    await user.type(nicknameFields[1]!, "Ada Prime");
    await user.tab();
    await user.click(screen.getByRole("button", { name: en.settings.nicknames.remove }));
  });

  it("creates and downloads exports", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    server.use(
      http.get("*/api/v1/export_jobs", () => HttpResponse.json({ export_jobs: [readyJob] })),
    );
    render(wrap(<ChatsPanel />));
    await screen.findByRole("button", { name: en.settings.export.download });
    await user.click(screen.getByRole("button", { name: en.settings.export.create }));
    await user.click(screen.getByRole("combobox", { name: en.settings.export.format_label }));
    await user.click(await screen.findByRole("option", { name: en.settings.export.format.html }));
    await user.click(screen.getByRole("combobox", { name: en.settings.export.conversation }));
    await user.click(await screen.findByRole("option", { name: "Ada Lovelace" }));
    await user.click(screen.getByRole("checkbox", { name: en.settings.export.include_media }));
    await user.click(screen.getByRole("button", { name: en.settings.export.create }));
    await user.click(screen.getByRole("button", { name: en.settings.export.download }));
    expect(open).toHaveBeenCalledWith("https://media.test/export", "_blank", "noopener");
    open.mockRestore();
  });

  it("shows a failed export and retries list errors", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    server.use(
      http.get("*/api/v1/export_jobs", () =>
        HttpResponse.json({
          export_jobs: [{ ...readyJob, status: "failed" }],
        }),
      ),
      http.get("*/api/v1/saved_replies", () =>
        HttpResponse.json(
          { error: { code: "fail", message: "fail", details: {} } },
          { status: 500 },
        ),
      ),
      http.get("*/api/v1/contact_nicknames", () =>
        HttpResponse.json(
          { error: { code: "fail", message: "fail", details: {} } },
          { status: 500 },
        ),
      ),
    );
    render(wrap(<ChatsPanel />));
    expect(await screen.findByText(en.settings.export.failed)).toBeInTheDocument();
    expect(screen.getAllByText(en.lists.error_title).length).toBeGreaterThan(0);
    for (const retry of screen.getAllByRole("button", { name: en.lists.error_retry })) {
      await user.click(retry);
    }
  });

  it("retries a failed export list", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    let fail = true;
    server.use(
      http.get("*/api/v1/export_jobs", () => {
        if (fail) {
          return HttpResponse.json(
            { error: { code: "fail", message: "fail", details: {} } },
            { status: 500 },
          );
        }
        return HttpResponse.json({ export_jobs: [] });
      }),
    );
    render(wrap(<ChatsPanel />));
    expect(await screen.findByText(en.lists.error_title)).toBeInTheDocument();
    fail = false;
    await user.click(screen.getByRole("button", { name: en.lists.error_retry }));
    expect(await screen.findByText(en.lists.empty_title)).toBeInTheDocument();
  });
});

describe("SettingsPanel chats", () => {
  it("opens chats from the hub", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(wrap(<SettingsPanel />));
    await user.click(screen.getByRole("button", { name: en.settings.chats }));
    expect(document.querySelector("[data-chats-panel]")).not.toBeNull();
    await waitFor(() => {
      expect(screen.getByText(en.settings.saved_replies.title)).toBeInTheDocument();
    });
  });
});
