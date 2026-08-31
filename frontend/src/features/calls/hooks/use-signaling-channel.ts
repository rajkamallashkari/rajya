import { useEffect } from "react";
import { getAccessSession } from "@/features/auth/model/access-session";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import {
  checkForStuckCall,
  handleSignalingMessage,
  setLocalAccountId,
  setSignalingSender,
} from "@/features/calls/lib";
import { publishMswSignaling } from "@/features/calls/lib/msw-signaling";
import { getCableConsumer } from "@/shared/lib/cable/consumer";

export function useSignalingChannel(): void {
  const accountId = useAccountsStore((state) => state.activeAccountId);

  useEffect(() => {
    if (accountId == null) {
      return;
    }
    setLocalAccountId(accountId);
    const subscription = getCableConsumer().subscriptions.create(
      { channel: "SignalingChannel" },
      {
        received(data: unknown) {
          void handleSignalingMessage(data);
        },
      },
    );
    void checkForStuckCall();
    setSignalingSender((action, data) => {
      try {
        subscription.perform(action, data);
      } catch {
        /* ActionCable may be closed under MSW; BroadcastChannel still relays. */
      }
      const sessionId = getAccessSession()?.accountId ?? accountId;
      publishMswSignaling(action, data, sessionId);
    });
    return () => {
      setSignalingSender(null);
      subscription.unsubscribe();
    };
  }, [accountId]);
}
