import type { InfiniteData } from "@tanstack/react-query";
import { CLIENT_CACHE_SIZE } from "@/features/conversations/model/settings";
import type { Message, MessagePage } from "@/features/conversations/api/http";

export type MessagePages = InfiniteData<MessagePage, { after?: number; before?: number }>;

export function flattenMessages(data: MessagePages | undefined): Message[] {
  if (!data) {
    return [];
  }
  const chronological = [...data.pages].reverse().flatMap((page) => page.messages);
  if (chronological.length <= CLIENT_CACHE_SIZE) {
    return chronological;
  }
  return chronological.slice(chronological.length - CLIENT_CACHE_SIZE);
}

export function mapPages(data: MessagePages, mapper: (message: Message) => Message): MessagePages {
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      messages: page.messages.map(mapper),
    })),
  };
}

export function appendToNewest(data: MessagePages, message: Message): MessagePages {
  if (data.pages.length === 0) {
    return {
      ...data,
      pages: [
        {
          messages: [message],
          meta: {
            has_more_before: false,
            has_more_after: false,
            oldest_position: message.position,
            newest_position: message.position,
            pivot_id: null,
          },
        },
      ],
    };
  }
  const pages = [...data.pages];
  const newest = pages[0];
  if (!newest) {
    return data;
  }
  pages[0] = { ...newest, messages: [...newest.messages, message] };
  return { ...data, pages };
}

export function restorePages(previous: MessagePages | undefined): MessagePages | undefined {
  return previous;
}

function sameRow(existing: Message, incoming: Message): boolean {
  if (incoming.id > 0 && existing.id === incoming.id) {
    return true;
  }
  return Boolean(incoming.client_nonce) && existing.client_nonce === incoming.client_nonce;
}

function replaceMatching(data: MessagePages, incoming: Message): MessagePages | undefined {
  let found = false;
  const pages = data.pages.map((page) => ({
    ...page,
    messages: page.messages.map((row) => {
      if (!sameRow(row, incoming)) {
        return row;
      }
      found = true;
      return incoming;
    }),
  }));
  return found ? { ...data, pages } : undefined;
}

function cachedRange(data: MessagePages): { max: number; min: number } | undefined {
  const positions = data.pages.flatMap((page) => page.messages.map((row) => row.position));
  if (positions.length === 0) {
    return undefined;
  }
  return { max: Math.max(...positions), min: Math.min(...positions) };
}

function insertSorted(data: MessagePages, incoming: Message): MessagePages {
  let inserted = false;
  const pages = data.pages.map((page) => {
    if (page.messages.length === 0) {
      return page;
    }
    const positions = page.messages.map((row) => row.position);
    const min = Math.min(...positions);
    const max = Math.max(...positions);
    if (incoming.position < min || incoming.position > max) {
      return page;
    }
    inserted = true;
    return {
      ...page,
      messages: [...page.messages, incoming].sort((left, right) => left.position - right.position),
    };
  });
  return inserted ? { ...data, pages } : appendToNewest(data, incoming);
}

function upsertOne(data: MessagePages, incoming: Message): MessagePages {
  const replaced = replaceMatching(data, incoming);
  if (replaced) {
    return replaced;
  }
  if (data.pages.length === 0) {
    return appendToNewest(data, incoming);
  }
  const range = cachedRange(data);
  if (range && incoming.position < range.min) {
    return data;
  }
  if (!range || incoming.position >= range.max) {
    return appendToNewest(data, incoming);
  }
  return insertSorted(data, incoming);
}

export function upsertMessages(data: MessagePages, updates: Message[]): MessagePages {
  return updates.reduce(upsertOne, data);
}

export function applyReceiptTick(
  data: MessagePages,
  viewerId: number,
  kind: string,
  position: number,
): MessagePages {
  const nextTick = kind === "read" ? "read" : kind === "delivered" ? "delivered" : null;
  if (!nextTick) {
    return data;
  }
  return mapPages(data, (message) => {
    if (!message.sender || message.sender.id !== viewerId || message.position > position || message.id < 0) {
      return message;
    }
    if (nextTick === "delivered" && message.tick === "read") {
      return message;
    }
    return { ...message, tick: nextTick };
  });
}
