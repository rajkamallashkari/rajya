import { useEffect, useRef } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { getCableConsumer, isCableConnected, type CableSubscription } from "@/shared/lib/cable/consumer";
import { RECONNECT_POLL_MS, UNMOUNT_GRACE_MS } from "@/shared/lib/cable/timing";
import { catchUpConversation, resetCatchUpScheduler, scheduleCatchUp } from "@/shared/lib/realtime/catch-up";
import { dispatchRealtimePayload, realtimeDeps } from "@/shared/lib/realtime/router";

function enqueueConversationCatchUp(queryClient: QueryClient, conversationId: number): void {
  scheduleCatchUp(() => {
    void catchUpConversation(queryClient, conversationId);
  });
}

export function useConversationChannel(conversationId: number | null): void {
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<CableSubscription | null>(null);
  const unmountTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wasConnected = useRef(isCableConnected());

  useEffect(() => {
    if (unmountTimer.current !== undefined) {
      clearTimeout(unmountTimer.current);
      unmountTimer.current = undefined;
    }
    if (conversationId == null) {
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
      return;
    }
    const id = conversationId;
    subscriptionRef.current?.unsubscribe();
    const subscription = getCableConsumer().subscriptions.create(
      { channel: "ConversationChannel", conversation_id: id },
      {
        received(data: unknown) {
          void dispatchRealtimePayload(data, realtimeDeps(queryClient));
        },
        connected() {
          if (!wasConnected.current) {
            enqueueConversationCatchUp(queryClient, id);
          }
          wasConnected.current = true;
        },
        disconnected() {
          wasConnected.current = false;
        },
      },
    );
    subscriptionRef.current = subscription;
    return () => {
      unmountTimer.current = setTimeout(() => {
        subscription.unsubscribe();
        subscriptionRef.current = null;
        resetCatchUpScheduler();
      }, UNMOUNT_GRACE_MS);
    };
  }, [conversationId, queryClient]);

  useEffect(() => {
    if (conversationId == null) {
      return;
    }
    const id = conversationId;
    const poll = setInterval(() => {
      const open = isCableConnected();
      if (open && !wasConnected.current) {
        wasConnected.current = true;
        enqueueConversationCatchUp(queryClient, id);
      } else if (!open) {
        wasConnected.current = false;
      }
    }, RECONNECT_POLL_MS);
    return () => clearInterval(poll);
  }, [conversationId, queryClient]);

  useEffect(() => {
    if (conversationId == null) {
      return;
    }
    const id = conversationId;
    const onVisible = (): void => {
      if (document.visibilityState === "visible" && isCableConnected()) {
        enqueueConversationCatchUp(queryClient, id);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [conversationId, queryClient]);
}
