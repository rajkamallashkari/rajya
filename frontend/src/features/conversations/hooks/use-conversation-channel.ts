import { useCallback, useEffect, useRef } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { getAccessSession } from "@/features/auth/model/access-session";
import type { ActivityKind } from "@/features/conversations/model/typing";
import { TYPING_THROTTLE_MS } from "@/features/conversations/model/typing";
import { getCableConsumer, isCableConnected, type CableSubscription } from "@/shared/lib/cable/consumer";
import { RECONNECT_POLL_MS, UNMOUNT_GRACE_MS } from "@/shared/lib/cable/timing";
import { catchUpConversation, resetCatchUpScheduler, scheduleCatchUp } from "@/shared/lib/realtime/catch-up";
import { publishMswRealtime } from "@/shared/lib/realtime/msw-bridge";
import { dispatchRealtimePayload, realtimeDeps } from "@/shared/lib/realtime/router";

function enqueueConversationCatchUp(queryClient: QueryClient, conversationId: number): void {
  scheduleCatchUp(() => {
    void catchUpConversation(queryClient, conversationId);
  });
}

export function useConversationChannel(conversationId: number | null): {
  publishActivity: (activity: ActivityKind) => void;
} {
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<CableSubscription | null>(null);
  const unmountTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wasConnected = useRef(isCableConnected());
  const lastSent = useRef(0);

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

  const publishActivity = useCallback(
    (activity: ActivityKind) => {
      if (conversationId == null) {
        return;
      }
      const now = Date.now();
      if (now - lastSent.current < TYPING_THROTTLE_MS) {
        return;
      }
      lastSent.current = now;
      subscriptionRef.current?.perform("typing", { activity });
      const session = getAccessSession();
      if (!session) {
        return;
      }
      publishMswRealtime({
        type: "typing",
        conversation_id: conversationId,
        account_id: session.accountId,
        activity,
        display_name: session.displayName,
      });
    },
    [conversationId],
  );

  return { publishActivity };
}
