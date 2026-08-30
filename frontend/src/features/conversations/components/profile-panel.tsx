import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useConversation } from "@/features/conversations/api/queries";
import { conversationById } from "@/features/conversations/model/demo";
import { parseConversationId } from "@/features/conversations/model/ids";
import { conversationTitle } from "@/features/conversations/model/title";
import { LayerHeader } from "@/app/navigation/layer-header";
import { Avatar } from "@/shared/ui/avatar";
import { ListView } from "@/shared/ui/list-view";

export function ProfilePanel({ conversationId }: { conversationId: string }): ReactNode {
  const liveId = parseConversationId(conversationId);
  if (liveId == null) {
    return <DemoProfile conversationId={conversationId} />;
  }
  return <LiveProfile conversationId={liveId} />;
}

function DemoProfile({ conversationId }: { conversationId: string }): ReactNode {
  const { t } = useTranslation();
  const conversation = conversationById(conversationId);
  if (!conversation) {
    return null;
  }
  return <ProfileBody name={conversation.name} subtitle={t("shell.profile_subtitle")} />;
}

function LiveProfile({ conversationId }: { conversationId: number }): ReactNode {
  const { t } = useTranslation();
  const query = useConversation(conversationId);
  if (query.isPending) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-[var(--surface-panel)]" data-profile-panel="">
        <ListView status="loading">{null}</ListView>
      </div>
    );
  }
  if (query.isError || !query.data) {
    return null;
  }
  return (
    <ProfileBody
      name={conversationTitle(query.data, t("conversations.untitled"))}
      subtitle={t("shell.profile_subtitle")}
    />
  );
}

function ProfileBody({ name, subtitle }: { name: string; subtitle: string }): ReactNode {
  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--surface-panel)]" data-profile-panel="">
      <LayerHeader title={name} />
      <div className="flex flex-col items-center gap-[var(--control-gap)] px-[var(--space-list-x)] py-[var(--space-8)]">
        <Avatar className="size-[var(--space-16)]" name={name} />
        <p className="[font-weight:var(--font-weight-emphasis)]">{name}</p>
        <p className="text-[var(--text-secondary)]">{subtitle}</p>
      </div>
    </div>
  );
}
