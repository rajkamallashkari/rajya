import type { QueryClient } from "@tanstack/react-query";
import { flattenMessages, upsertMessages, type MessagePages } from "@/features/conversations/api/cache";
import { listMessages, type Message, type MessagePage } from "@/features/conversations/api/http";
import { conversationKeys, messageKeys } from "@/features/conversations/api/keys";
import { RECONNECT_DELAY_MS } from "@/shared/lib/cable/timing";

export type CatchUpFetcher = (conversationId: number, afterRevision: number) => Promise<MessagePage>;

let catchUpTimer: ReturnType<typeof setTimeout> | undefined;

export function maxRevision(messages: Message[]): number | null {
  if (messages.length === 0) {
    return null;
  }
  return messages.reduce((max, message) => Math.max(max, message.revision), 0);
}

export function cachedConversationIds(client: QueryClient): number[] {
  return client
    .getQueriesData<MessagePages>({ queryKey: [...messageKeys.all, "page"] })
    .flatMap(([key]) => {
      const id = key[2];
      return typeof id === "number" ? [id] : [];
    });
}

export async function catchUpConversation(
  client: QueryClient,
  conversationId: number,
  fetchPage: CatchUpFetcher = (id, afterRevision) => listMessages(id, { after_revision: afterRevision }),
): Promise<void> {
  const key = messageKeys.page(conversationId);
  const current = client.getQueryData<MessagePages>(key);
  const after = maxRevision(flattenMessages(current));
  if (after == null || !current) {
    await client.invalidateQueries({ queryKey: key });
    return;
  }
  const page = await fetchPage(conversationId, after);
  if (page.messages.length === 0) {
    return;
  }
  client.setQueryData(key, upsertMessages(current, page.messages));
}

export async function catchUpCachedConversations(
  client: QueryClient,
  fetchPage?: CatchUpFetcher,
): Promise<void> {
  await client.invalidateQueries({ queryKey: conversationKeys.list() });
  await Promise.all(
    cachedConversationIds(client).map((conversationId) =>
      catchUpConversation(client, conversationId, fetchPage ?? defaultFetcher),
    ),
  );
}

function defaultFetcher(conversationId: number, afterRevision: number): Promise<MessagePage> {
  return listMessages(conversationId, { after_revision: afterRevision });
}

export function scheduleCatchUp(run: () => void, delay = RECONNECT_DELAY_MS): void {
  clearTimeout(catchUpTimer);
  catchUpTimer = setTimeout(run, delay);
}

export function resetCatchUpScheduler(): void {
  clearTimeout(catchUpTimer);
  catchUpTimer = undefined;
}
