export function parseConversationId(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }
  return Number(value);
}

export function newClientNonce(): string {
  return crypto.randomUUID();
}
