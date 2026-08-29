import { useSyncExternalStore } from "react";
import { isMobileViewport, subscribeViewport } from "@/shared/lib/navigation/viewport";

export function useMobileViewport(): boolean {
  return useSyncExternalStore(subscribeViewport, isMobileViewport, isMobileViewport);
}
