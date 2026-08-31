import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/app/providers";
import { searchPeople } from "@/features/search/api/http";
import { usePeopleSearch } from "@/features/search/api/queries";
import { ChatSearchBar } from "@/features/search/components/chat-search-bar";
import { GlobalSearchHits } from "@/features/search/components/global-search-hits";
import { JumpDateSheet } from "@/features/search/components/jump-date-sheet";
import { SearchResultsPanel } from "@/features/search/components/search-results-panel";
import { useDebouncedValue } from "@/features/search/hooks/use-debounced-value";
import {
  SEARCH_DEBOUNCE_MS,
  SEARCH_FIXTURE_NEEDLE,
  SEARCH_MIN_QUERY_LENGTH,
} from "@/features/search/model/constants";
import {
  meetsMinQueryLength,
  splitHighlight,
  wrapMatchIndex,
} from "@/features/search/model/highlight";
import { jumpDateIso, startOfDayIso } from "@/features/search/model/jump-dates";
import { resetSearchStore, useSearchStore } from "@/features/search/store/search-store";
import { MESSAGE_STAMP } from "@/shared/lib/api/msw/messaging-store";
import { en } from "@/shared/lib/i18n/catalog";
import { server } from "@/test/msw";

afterEach(() => {
  resetSearchStore();
});

function DebounceProbe({ value }: { value: string }) {
  const debounced = useDebouncedValue(value, SEARCH_DEBOUNCE_MS);
  return <p>{debounced}</p>;
}

function PeopleProbe({ query }: { query: string }) {
  const search = usePeopleSearch(query);
  return <p data-people={String(search.data?.accounts.length ?? 0)} />;
}

describe("search models", () => {
  it("enforces the settings minimum, debounce, highlight, wrap, and date shortcuts", async () => {
    expect(SEARCH_MIN_QUERY_LENGTH).toBe(2);
    expect(SEARCH_DEBOUNCE_MS).toBe(350);
    expect(meetsMinQueryLength("a", SEARCH_MIN_QUERY_LENGTH)).toBe(false);
    expect(meetsMinQueryLength("ab", SEARCH_MIN_QUERY_LENGTH)).toBe(true);
    expect(splitHighlight("memento unique", "mento")).toEqual([
      { highlight: false, text: "me" },
      { highlight: true, text: "mento" },
      { highlight: false, text: " unique" },
    ]);
    expect(splitHighlight("plain", "")).toEqual([{ highlight: false, text: "plain" }]);
    expect(splitHighlight("plain", "zz")).toEqual([{ highlight: false, text: "plain" }]);
    expect(splitHighlight("a+b", "a+b")).toEqual([{ highlight: true, text: "a+b" }]);
    expect(wrapMatchIndex(0, 3, 1)).toBe(1);
    expect(wrapMatchIndex(2, 3, 1)).toBe(0);
    expect(wrapMatchIndex(0, 0, 1)).toBe(0);
    expect(jumpDateIso("today", Date.parse("2026-08-31T12:00:00.000Z"))).toBe(
      "2026-08-31T12:00:00.000Z",
    );
    expect(jumpDateIso("yesterday", Date.parse("2026-08-31T12:00:00.000Z"))).toBe(
      "2026-08-30T12:00:00.000Z",
    );
    expect(jumpDateIso("week", Date.parse("2026-08-31T12:00:00.000Z"))).toBe(
      "2026-08-24T12:00:00.000Z",
    );
    expect(startOfDayIso("2026-01-02")).toBe("2026-01-02T00:00:00.000Z");
    expect(startOfDayIso("nope")).toBeNull();
    expect(startOfDayIso("2026-13-40")).toBeNull();
    const { rerender } = render(
      <AppProviders>
        <DebounceProbe value="a" />
      </AppProviders>,
    );
    rerender(
      <AppProviders>
        <DebounceProbe value="ab" />
      </AppProviders>,
    );
    expect(screen.getByText("a")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("ab")).toBeInTheDocument();
    });
  });
});

describe("search store", () => {
  it("opens chat search, toggles mode, and restores jump then close", () => {
    useSearchStore.getState().openChatSearch();
    useSearchStore.getState().setQuery("ab");
    useSearchStore.getState().toggleMode();
    expect(useSearchStore.getState().mode).toBe("list");
    useSearchStore.getState().pushJump({ conversationId: "15", scrollTop: 40 });
    expect(useSearchStore.getState().popJump()).toEqual({ conversationId: "15", scrollTop: 40 });
    expect(useSearchStore.getState().popJump()).toBeUndefined();
    useSearchStore.getState().pushJump({ conversationId: "15", scrollTop: 40 });
    expect(useSearchStore.getState().handleBack()).toEqual({ conversationId: "15", scrollTop: 40 });
    expect(useSearchStore.getState().handleBack()).toBe("closed");
    expect(useSearchStore.getState().handleBack()).toBeNull();
  });
});

describe("search UI", () => {
  it("searches in-chat, lists hits, and jumps", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    useSearchStore.getState().openChatSearch();
    useSearchStore.getState().setMode("list");
    const onJump = vi.fn();
    render(
      <AppProviders>
        <ChatSearchBar conversationId={15} matchIndex={0} onCycle={vi.fn()} />
        <SearchResultsPanel conversationId={15} onJump={onJump} />
      </AppProviders>,
    );
    expect(screen.getByText(en.search.type_to_search)).toBeInTheDocument();
    await user.type(screen.getByLabelText(en.search.in_chat_list), SEARCH_FIXTURE_NEEDLE);
    expect(await screen.findByText(/unique/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /unique/i }));
    expect(onJump).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: en.search.clear }));
    await user.click(screen.getByRole("button", { name: en.search.mode_navigate }));
    await user.click(screen.getByLabelText(en.search.in_chat));
    await user.keyboard("{Escape}");
    expect(useSearchStore.getState().chatOpen).toBe(false);
  });

  it("cycles navigate keys and shows an empty list", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onCycle = vi.fn();
    useSearchStore.getState().openChatSearch();
    render(
      <AppProviders>
        <ChatSearchBar conversationId={15} matchIndex={0} onCycle={onCycle} />
        <SearchResultsPanel conversationId={15} onJump={vi.fn()} />
      </AppProviders>,
    );
    expect(screen.queryByText(en.search.type_to_search)).not.toBeInTheDocument();
    const field = screen.getByLabelText(en.search.in_chat);
    await user.type(field, SEARCH_FIXTURE_NEEDLE);
    await user.keyboard("{Enter}");
    await user.keyboard("{Shift>}{Enter}{/Shift}");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowUp}");
    expect(onCycle).toHaveBeenCalled();
    await user.clear(field);
    await user.type(field, "zz");
    useSearchStore.getState().setMode("list");
    expect(await screen.findByText(en.search.no_results)).toBeInTheDocument();
  });

  it("renders untitled senders when a hit has no name", async () => {
    server.use(
      http.get("*/api/v1/conversations/:id/search", () =>
        HttpResponse.json({
          messages: [
            {
              can_forward: true,
              conversation_id: 15,
              created_at: MESSAGE_STAMP,
              message_id: 9,
              sender_name: null,
              snippet: "ab",
            },
          ],
          query: "ab",
        }),
      ),
    );
    useSearchStore.getState().openChatSearch();
    useSearchStore.getState().setMode("list");
    useSearchStore.getState().setQuery("ab");
    render(
      <AppProviders>
        <SearchResultsPanel conversationId={15} onJump={vi.fn()} />
      </AppProviders>,
    );
    expect(await screen.findByText(en.conversations.untitled)).toBeInTheDocument();
  });

  it("renders global hits and people search", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onAccount = vi.fn();
    const onConversation = vi.fn();
    const onMessage = vi.fn();
    const { rerender } = render(
      <AppProviders>
        <GlobalSearchHits
          onAccount={onAccount}
          onConversation={onConversation}
          onMessage={onMessage}
          query="a"
        />
        <PeopleProbe query="a" />
      </AppProviders>,
    );
    expect(screen.queryByText(en.search.messages)).not.toBeInTheDocument();
    rerender(
      <AppProviders>
        <GlobalSearchHits
          onAccount={onAccount}
          onConversation={onConversation}
          onMessage={onMessage}
          query="zz"
        />
        <PeopleProbe query="zz" />
      </AppProviders>,
    );
    await waitFor(() => {
      expect(document.querySelector("[data-people]")?.getAttribute("data-people")).toBe("0");
    });
    expect(await searchPeople("zz")).toEqual({ accounts: [] });
    rerender(
      <AppProviders>
        <GlobalSearchHits
          onAccount={onAccount}
          onConversation={onConversation}
          onMessage={onMessage}
          query="Adele"
        />
      </AppProviders>,
    );
    expect(await screen.findByText(en.search.people)).toBeInTheDocument();
    const adeleHits = screen.getAllByRole("button", { name: "Adele Goldberg" });
    await user.click(adeleHits[0]!);
    expect(onAccount).toHaveBeenCalled();
    await user.click(adeleHits[1]!);
    expect(onConversation).toHaveBeenCalled();
    rerender(
      <AppProviders>
        <GlobalSearchHits
          onAccount={onAccount}
          onConversation={onConversation}
          onMessage={onMessage}
          query={SEARCH_FIXTURE_NEEDLE}
        />
      </AppProviders>,
    );
    expect(await screen.findByText(en.search.messages)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /unique/i }));
    expect(onMessage).toHaveBeenCalled();
  });

  it("jumps by date shortcuts", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onJump = vi.fn();
    useSearchStore.getState().setDateOpen(true);
    render(
      <AppProviders>
        <JumpDateSheet onJump={onJump} />
      </AppProviders>,
    );
    await user.click(screen.getByRole("button", { name: en.search.jump_today }));
    await user.type(screen.getByLabelText(en.search.pick_date), "2026-01-02");
    useSearchStore.getState().setDateOpen(true);
    await user.click(screen.getByRole("button", { name: en.search.jump_yesterday }));
    await user.click(screen.getByRole("button", { name: en.search.jump_week }));
    expect(onJump).toHaveBeenCalled();
  });
});
