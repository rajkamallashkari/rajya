import type { components } from "@/shared/lib/api/schema";

type Bot = components["schemas"]["Bot"];

export const COMPOSE_AT = "@";

export function composeSearchNeedle(query: string): string {
  const trimmed = query.trim();
  if (trimmed.startsWith(COMPOSE_AT)) {
    return trimmed.slice(COMPOSE_AT.length);
  }
  return trimmed;
}

export function composeUsernameOnly(query: string): boolean {
  return query.trim().startsWith(COMPOSE_AT);
}

export function botMatchesComposeQuery(bot: Bot, query: string): boolean {
  const needle = composeSearchNeedle(query).toLowerCase();
  if (!needle) {
    return true;
  }
  if (composeUsernameOnly(query)) {
    return bot.account.username.toLowerCase().includes(needle);
  }
  return (
    bot.account.display_name.toLowerCase().includes(needle) ||
    bot.account.username.toLowerCase().includes(needle)
  );
}

export function enoughGroupMembers(selectedCount: number, minMembers: number): boolean {
  return selectedCount + 1 >= minMembers;
}
