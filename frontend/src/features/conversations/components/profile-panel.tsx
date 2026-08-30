import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { useConversation } from "@/features/conversations/api/queries";
import { InviteManager } from "@/features/conversations/components/invite-manager";
import { QrSheet } from "@/features/conversations/components/qr-sheet";
import { conversationById } from "@/features/conversations/model/demo";
import { parseConversationId } from "@/features/conversations/model/ids";
import { canManageInvites, profileUrl } from "@/features/conversations/model/links";
import { conversationTitle } from "@/features/conversations/model/title";
import { copyText } from "@/features/messages/model/copy-text";
import { LayerHeader } from "@/app/navigation/layer-header";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
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
  const [qrPayload, setQrPayload] = useState<string | null>(null);
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
  const username = query.data.peer?.username;
  return (
    <ProfileBody
      name={conversationTitle(query.data, t("conversations.untitled"))}
      subtitle={t("shell.profile_subtitle")}
    >
      {canManageInvites(query.data.kind, query.data.role) ? (
        <InviteManager conversationId={conversationId} />
      ) : null}
      {username ? (
        <Button
          className="mx-[var(--space-list-x)]"
          onClick={() => setQrPayload(profileUrl(globalThis.location.origin, username))}
          type="button"
          variant="secondary"
        >
          {t("invites.profile_qr")}
        </Button>
      ) : null}
      <QrSheet
        onCopy={qrPayload ? () => void copyText(qrPayload) : undefined}
        onOpenChange={(open) => {
          if (!open) {
            setQrPayload(null);
          }
        }}
        open={qrPayload != null}
        payload={qrPayload ?? ""}
      />
    </ProfileBody>
  );
}

function ProfileBody({
  children,
  name,
  subtitle,
}: {
  children?: ReactNode;
  name: string;
  subtitle: string;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--surface-panel)]" data-profile-panel="">
      <LayerHeader title={name} />
      <div className="flex flex-col items-center gap-[var(--control-gap)] px-[var(--space-list-x)] py-[var(--space-8)]">
        <Avatar className="size-[var(--space-16)]" name={name} />
        <p className="[font-weight:var(--font-weight-emphasis)]">{name}</p>
        <p className="text-[var(--text-secondary)]">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
