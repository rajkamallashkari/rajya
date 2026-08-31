export function disclosesSharedMemory(account: {
  kind: string;
  shared_memory?: boolean;
}): boolean {
  return account.kind === "bot" || Boolean(account.shared_memory);
}

export function isNewBotConversation(
  conversation: { kind: string; peer?: { kind: string } | null },
  messages: { kind: string }[],
): boolean {
  return (
    conversation.kind === "direct" &&
    conversation.peer?.kind === "bot" &&
    !messages.some((message) => message.kind !== "system")
  );
}
