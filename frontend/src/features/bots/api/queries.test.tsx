import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { setAccessSession } from "@/features/auth/model/access-session";
import {
  buildStyleProfile,
  createBotRequest,
  getBot,
  getStyleProfile,
  listBotRequests,
  listBots,
  rewriteDraft,
  suggestReplies,
  summarizeConversation,
  translateMessage,
  translateText,
  updateStyleConsent,
} from "@/features/bots/api/http";
import {
  useBots,
  useBuildStyleProfile,
  useCreateBotRequest,
  useRewrite,
  useStartDirectChat,
  useStyleProfile,
  useSuggestReplies,
  useSummarize,
  useTranslateMessage,
  useUpdateStyleConsent,
} from "@/features/bots/api/queries";
import { en } from "@/shared/lib/i18n/catalog";
import { Button } from "@/shared/ui/button";
import { testSession } from "@/test/access-session";
import { server } from "@/test/msw";

function Harness() {
  const bots = useBots();
  const style = useStyleProfile();
  const create = useCreateBotRequest();
  const start = useStartDirectChat();
  const rewrite = useRewrite();
  const translate = useTranslateMessage();
  const suggest = useSuggestReplies(1);
  const summarize = useSummarize(1);
  const consent = useUpdateStyleConsent();
  const build = useBuildStyleProfile();
  return (
    <div>
      <p>{bots.data?.bots[0]?.account.display_name ?? "none"}</p>
      <p>{style.data?.enabled ? "on" : "off"}</p>
      <p>{rewrite.data?.text ?? ""}</p>
      <p>{suggest.data?.suggestions[0] ?? ""}</p>
      <p>{summarize.data?.text ?? ""}</p>
      <p>{translate.data?.text ?? ""}</p>
      <p>{create.data?.status ?? ""}</p>
      <p>{start.data ? String(start.data.id) : ""}</p>
      <Button onClick={() => create.mutate({ kind: "create", payload: { bio: "b", name: "N", persona_prompt: "A".repeat(80), username: "n" } })} type="button">
        propose
      </Button>
      <Button onClick={() => start.mutate(99)} type="button">
        dm
      </Button>
      <Button
        onClick={() => rewrite.mutate({ instruction: en.ai.rewrite_instruction, text: "hey" })}
        type="button"
      >
        rewrite
      </Button>
      <Button onClick={() => translate.mutate({ id: 1, targetLanguage: "en" })} type="button">
        translate
      </Button>
      <Button onClick={() => suggest.mutate(1)} type="button">
        suggest
      </Button>
      <Button onClick={() => summarize.mutate("unread")} type="button">
        summarize
      </Button>
      <Button onClick={() => consent.mutate(true)} type="button">
        opt-in
      </Button>
      <Button onClick={() => build.mutate()} type="button">
        build
      </Button>
    </div>
  );
}

describe("bot and helper queries", () => {
  it("covers list, rewrite, helpers, consent, and a DM start", async () => {
    setAccessSession(testSession());
    const listed = await listBots();
    expect(listed.bots[0]?.account.kind).toBe("bot");
    expect((await getBot(1)).account.username).toBe("nimbus");
    expect((await listBotRequests()).bot_requests).toEqual([]);
    expect(
      (await createBotRequest({ kind: "create", payload: { bio: "Sky", name: "Nimbus", persona_prompt: "A".repeat(80), username: "nimbus" } })).status,
    ).toBe("pending");
    expect((await rewriteDraft({ instruction: "Rewrite this draft", text: "hey" })).text).toBe(
      "Hello",
    );
    expect((await translateMessage(1, { target_language: "en" })).text).toBe("Hello");
    expect((await translateText({ target_language: "en", text: "Hola" })).text).toBe("Hello");
    expect((await suggestReplies(1, 1)).suggestions[0]).toBe("On my way");
    expect((await summarizeConversation(1, "unread")).text).toBe("Ship Friday");
    expect((await getStyleProfile()).enabled).toBe(false);
    expect((await updateStyleConsent(true)).enabled).toBe(true);
    expect((await buildStyleProfile()).profile).toContain("Casual");

    const user = userEvent.setup();
    render(
      <AppProviders>
        <Harness />
      </AppProviders>,
    );
    expect(await screen.findByText("Nimbus")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "propose" }));
    await user.click(screen.getByRole("button", { name: "dm" }));
    await user.click(screen.getByRole("button", { name: "rewrite" }));
    await user.click(screen.getByRole("button", { name: "translate" }));
    await user.click(screen.getByRole("button", { name: "suggest" }));
    await user.click(screen.getByRole("button", { name: "summarize" }));
    await user.click(screen.getByRole("button", { name: "opt-in" }));
    await user.click(screen.getByRole("button", { name: "build" }));
    await waitFor(() => {
      expect(screen.getAllByText("Hello").length).toBeGreaterThan(0);
    });
  });

  it("surfaces a missing bot", async () => {
    setAccessSession(testSession());
    server.use(http.get("*/api/v1/bots/:id", () => HttpResponse.json({ error: { code: "not_found", message: "not_found", details: {} } }, { status: 404 })));
    await expect(getBot(9)).rejects.toBeTruthy();
  });
});
