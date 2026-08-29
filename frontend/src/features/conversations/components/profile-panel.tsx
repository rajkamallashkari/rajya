import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { conversationById } from "@/features/conversations/model/demo";
import { LayerHeader } from "@/app/navigation/layer-header";
import { Avatar } from "@/shared/ui/avatar";

export function ProfilePanel({ conversationId }: { conversationId: string }): ReactNode {
  const { t } = useTranslation();
  const conversation = conversationById(conversationId);
  if (!conversation) {
    return null;
  }
  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--surface-panel)]" data-profile-panel="">
      <LayerHeader title={conversation.name} />
      <div className="flex flex-col items-center gap-[var(--control-gap)] px-[var(--space-list-x)] py-[var(--space-8)]">
        <Avatar className="size-[var(--space-16)]" name={conversation.name} />
        <p className="[font-weight:var(--font-weight-emphasis)]">{conversation.name}</p>
        <p className="text-[var(--text-secondary)]">{t("shell.profile_subtitle")}</p>
      </div>
    </div>
  );
}
