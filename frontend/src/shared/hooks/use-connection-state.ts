import { useEffect, useRef, useState } from "react";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { isCableConnected } from "@/shared/lib/cable/consumer";
import { CONNECTION_POLL_MS } from "@/shared/lib/cable/timing";

export function useConnectionState(): {
  cableConnected: boolean;
  isDisconnected: boolean;
  isOnline: boolean;
  labelKey: "offline.reconnecting" | "offline.waiting";
} {
  const token = useAccountsStore((state) => {
    const active = state.accounts.find((account) => account.id === state.activeAccountId);
    return active?.token ?? null;
  });
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [cableConnected, setCableConnected] = useState(() => isCableConnected());
  const everConnected = useRef(isCableConnected());

  useEffect(() => {
    const onOnline = (): void => setIsOnline(true);
    const onOffline = (): void => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const open = isCableConnected();
      if (open) {
        everConnected.current = true;
      }
      setCableConnected(open);
    }, CONNECTION_POLL_MS);
    return () => clearInterval(id);
  }, []);

  const isDisconnected = token
    ? !cableConnected && everConnected.current
    : !isOnline;
  const labelKey = !isOnline && !cableConnected ? "offline.waiting" : "offline.reconnecting";
  return { cableConnected, isDisconnected, isOnline, labelKey };
}
