export const SHELL_DESTINATIONS = ["chats", "calls", "profile"] as const;

export type ShellDestination = (typeof SHELL_DESTINATIONS)[number];

export const DEFAULT_SHELL_DESTINATION: ShellDestination = "chats";

export function shouldHideMobileTabBar({
  destination,
  layerCount,
  mobile,
}: {
  destination: ShellDestination;
  layerCount: number;
  mobile: boolean;
}): boolean {
  return mobile && destination === "chats" && layerCount > 0;
}
