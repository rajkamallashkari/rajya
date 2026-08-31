import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { isOwnMswCallEvent } from "@/features/calls/lib/msw-signaling";
import { getCableConsumer, isCableConnected, resetCableConsumer } from "@/shared/lib/cable/consumer";
import { catchUpCachedConversations, scheduleCatchUp } from "@/shared/lib/realtime/catch-up";
import { subscribeMswRealtime } from "@/shared/lib/realtime/msw-bridge";
import { dispatchRealtimePayload, realtimeDeps } from "@/shared/lib/realtime/router";

export function useAccountChannel(): void {
  const token = useAccountsStore((state) => {
    const active = state.accounts.find((account) => account.id === state.activeAccountId);
    return active?.token ?? null;
  });
  const accountId = useAccountsStore((state) => state.activeAccountId);
  const queryClient = useQueryClient();
  const wasConnected = useRef(isCableConnected());

  const runCatchUp = useCallback(() => {
    scheduleCatchUp(() => {
      void catchUpCachedConversations(queryClient);
    });
  }, [queryClient]);

  useEffect(() => {
    if (!token) {
      resetCableConsumer();
      return;
    }
    const consumer = getCableConsumer();
    const handlers = {
      received(data: unknown) {
        void dispatchRealtimePayload(data, realtimeDeps(queryClient));
      },
      connected() {
        if (!wasConnected.current) {
          runCatchUp();
        }
        wasConnected.current = true;
      },
      disconnected() {
        wasConnected.current = false;
      },
    };
    const account = consumer.subscriptions.create({ channel: "AccountChannel" }, handlers);
    const presence = consumer.subscriptions.create({ channel: "PresenceChannel" }, handlers);
    return () => {
      account.unsubscribe();
      presence.unsubscribe();
      resetCableConsumer();
    };
  }, [queryClient, runCatchUp, token]);

  useEffect(() => {
    if (!token) {
      return;
    }
    return subscribeMswRealtime((data) => {
      if (isOwnMswCallEvent(data, accountId)) {
        return;
      }
      void dispatchRealtimePayload(data, realtimeDeps(queryClient));
    });
  }, [accountId, queryClient, token]);
}
