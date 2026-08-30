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
