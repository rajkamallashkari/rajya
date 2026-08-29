import { useState, type ReactNode } from "react";
import { Composer } from "@/features/composer";
import { conversationById, type DemoMessage } from "@/features/conversations/model/demo";
import { MessageGroup } from "@/features/messages";
import { LayerHeader } from "@/app/navigation/layer-header";
import { useMobileViewport } from "@/shared/hooks/use-mobile-viewport";
import { useLayerStore } from "@/shared/lib/navigation/layer-store";

export function ConversationThread({ conversationId }: { conversationId: string }): ReactNode {
  const conversation = conversationById(conversationId);
  const pushLayer = useLayerStore((state) => state.pushLayer);
  const mobile = useMobileViewport();
  const [messages, setMessages] = useState<DemoMessage[]>(conversation?.messages ?? []);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!conversation) {
    return null;
  }

  const received = messages.filter((message) => message.side === "received");
  const sent = messages.filter((message) => message.side === "sent");
  const lastSent = [...sent].reverse()[0];

  return (
    <div
      className="flex h-full min-h-0 flex-col bg-[var(--surface-chat)]"
      data-conversation-thread=""
    >
      <LayerHeader
        onTitleClick={() =>
          pushLayer({
            conversationId,
            id: `profile:${conversationId}`,
            kind: "profile",
            title: conversation.name,
          })
        }
        showBack={mobile}
        title={conversation.name}
      />
      <div
        className="flex min-h-0 flex-1 flex-col gap-[var(--space-4)] overflow-y-auto px-[var(--space-list-x)] py-[var(--space-list-y)]"
        data-layer-scroll={conversationId}
      >
        {received.length > 0 ? (
          <MessageGroup messages={received} senderName={conversation.name} side="received" />
        ) : null}
        {sent.length > 0 ? <MessageGroup messages={sent} side="sent" /> : null}
      </div>
      <Composer
        editing={editingId !== null}
        onChange={setDraft}
        onDismissEdit={() => {
          setEditingId(null);
          setDraft("");
        }}
        onEditLast={() => {
          if (!lastSent) {
            return;
          }
          setEditingId(lastSent.id);
          setDraft(lastSent.body);
        }}
        onSend={({ text }) => {
          if (editingId) {
            setMessages((current) =>
              current.map((message) =>
                message.id === editingId ? { ...message, body: text } : message,
              ),
            );
            setEditingId(null);
          } else {
            setMessages((current) => [
              ...current,
              { body: text, id: `local-${current.length}`, side: "sent" },
            ]);
          }
          setDraft("");
        }}
        value={draft}
      />
    </div>
  );
}
