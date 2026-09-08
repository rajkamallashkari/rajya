export const SHELL_DESTINATIONS = ["chats", "calls", "profile"] as const;

export type ShellDestination = (typeof SHELL_DESTINATIONS)[number];

export const DEFAULT_SHELL_DESTINATION: ShellDestination = "chats";

export function shouldHideMobileTabBar({
  destination,
  layerCount,
  mobile,
  nested = false,
}: {
  destination: ShellDestination;
  layerCount: number;
  mobile: boolean;
  nested?: boolean;
}): boolean {
  if (!mobile) {
    return false;
  }
  if (destination === "chats") {
    return layerCount > 0;
  }
  return nested;
}
