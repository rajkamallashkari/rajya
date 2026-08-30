import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { upsertMessages, type MessagePages } from "@/features/conversations/api/cache";
import { conversationKeys, messageKeys } from "@/features/conversations/api/keys";
import { persistMessagePages } from "@/features/conversations/api/persist";
import { shouldStartMsw } from "@/shared/lib/api/msw/flag";
import { drainOutbox, setOutboxCallbacks } from "@/shared/lib/outbox/processor";
import {
  OUTBOX_SYNC_FAILED,
  OUTBOX_SYNC_SUCCESS,
  type OutboxWorkerMessage,
} from "@/shared/lib/outbox/worker";

declare global {
  interface Window {
    __rajyaDrainOutbox?: () => Promise<unknown>;
    __rajyaDualDrainOutbox?: () => Promise<unknown>;
  }
}

function dropOptimistic(data: MessagePages, nonce: string): MessagePages {
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      messages: page.messages.filter(
        (message) => message.client_nonce !== nonce || message.id > 0,
      ),
    })),
  };
}

export function bindOutboxTestHooks(
  accountId: number,
  flag: string | undefined = import.meta.env.VITE_MSW,
): () => void {
  if (!shouldStartMsw(flag)) {
    return () => undefined;
  }
  window.__rajyaDrainOutbox = () => drainOutbox(accountId);
  window.__rajyaDualDrainOutbox = () => Promise.all([drainOutbox(accountId), drainOutbox(accountId)]);
  return () => {
    delete window.__rajyaDrainOutbox;
    delete window.__rajyaDualDrainOutbox;
  };
}

export function useOutboxLifecycle(): void {
  const queryClient = useQueryClient();
  const accountId = useAccountsStore((state) => state.activeAccountId);

  useEffect(() => {
    setOutboxCallbacks({
      onFailed: (entry) => {
        const key = messageKeys.page(entry.conversationId);
        const current = queryClient.getQueryData<MessagePages>(key);
        if (current) {
          queryClient.setQueryData(key, dropOptimistic(current, entry.id));
        }
      },
      onSent: (entry, message) => {
        const key = messageKeys.page(entry.conversationId);
        const current = queryClient.getQueryData<MessagePages>(key);
        if (current) {
          const next = upsertMessages(current, [message]);
          queryClient.setQueryData(key, next);
          persistMessagePages(entry.conversationId, next);
        }
        void queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
      },
    });
    return () => {
      setOutboxCallbacks({});
    };
  }, [queryClient]);

  useEffect(() => {
    if (accountId == null) {
      return;
    }
    void drainOutbox(accountId);
    const onOnline = () => {
      void drainOutbox(accountId);
    };
    window.addEventListener("online", onOnline);
    const onMessage = (event: MessageEvent<OutboxWorkerMessage>) => {
      const data = event.data;
      if (!data || typeof data !== "object") {
        return;
      }
      if (data.type === OUTBOX_SYNC_SUCCESS) {
        const key = messageKeys.page(data.conversationId);
        const current = queryClient.getQueryData<MessagePages>(key);
        if (current) {
          queryClient.setQueryData(key, upsertMessages(current, [data.message]));
        }
        persistMessagePages(data.conversationId, queryClient.getQueryData<MessagePages>(key));
        return;
      }
      if (data.type === OUTBOX_SYNC_FAILED) {
        const key = messageKeys.page(data.conversationId);
        const current = queryClient.getQueryData<MessagePages>(key);
        if (current) {
          queryClient.setQueryData(key, dropOptimistic(current, data.clientId));
        }
      }
    };
    navigator.serviceWorker?.addEventListener("message", onMessage);
    const unbindTestHooks = bindOutboxTestHooks(accountId);
    return () => {
      window.removeEventListener("online", onOnline);
      navigator.serviceWorker?.removeEventListener("message", onMessage);
      unbindTestHooks();
    };
  }, [accountId, queryClient]);
}
