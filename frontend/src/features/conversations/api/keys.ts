export const conversationKeys = {
  all: ["conversations"] as const,
  list: () => [...conversationKeys.all, "list"] as const,
  detail: (id: number) => [...conversationKeys.all, "detail", id] as const,
};

export const savedReplyKeys = {
  all: ["saved-replies"] as const,
  list: () => [...savedReplyKeys.all, "list"] as const,
};

export const messageKeys = {
  all: ["messages"] as const,
  page: (conversationId: number) => [...messageKeys.all, "page", conversationId] as const,
  around: (conversationId: number, target: { at?: string; messageId?: number }) =>
    [...messageKeys.all, "around", conversationId, target] as const,
  info: (id: number) => [...messageKeys.all, "info", id] as const,
  permalink: (id: number) => [...messageKeys.all, "permalink", id] as const,
  reactions: (id: number) => [...messageKeys.all, "reactions", id] as const,
  poll: (id: number) => [...messageKeys.all, "poll", id] as const,
  pinned: (conversationId: number) => [...messageKeys.all, "pinned", conversationId] as const,
  saved: () => [...messageKeys.all, "saved"] as const,
};
