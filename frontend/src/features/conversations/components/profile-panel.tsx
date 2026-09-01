import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { AccountProfile } from "@/features/auth/components/account-profile";
import { useConversation } from "@/features/conversations/api/queries";
import { InviteManager } from "@/features/conversations/components/invite-manager";
import { GroupPermissions } from "@/features/conversations/components/group-permissions";
import { QrSheet } from "@/features/conversations/components/qr-sheet";
import { ReportHost } from "@/features/conversations/components/report-host";
import { conversationById } from "@/features/conversations/model/demo";
import { parseConversationId } from "@/features/conversations/model/ids";
import { WallpaperPicker } from "@/features/settings/components/wallpaper-picker";
import { canEditInfo, canManageInvites, profileUrl } from "@/features/conversations/model/links";
import { conversationTitle } from "@/features/conversations/model/title";
import { copyText } from "@/features/messages/model/copy-text";
import { LayerHeader } from "@/app/navigation/layer-header";
import { useLayerStore } from "@/shared/lib/navigation/layer-store";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { ListView } from "@/shared/ui/list-view";

export function ProfilePanel({
  accountId,
  conversationId,
}: {
  accountId?: string;
  conversationId: string;
}): ReactNode {
  if (accountId) {
    return <AccountContactProfile accountId={accountId} />;
  }
  const liveId = parseConversationId(conversationId);
  if (liveId == null) {
    return <DemoProfile conversationId={conversationId} />;
  }
  return <LiveProfile conversationId={liveId} />;
}

function AccountContactProfile({ accountId }: { accountId: string }): ReactNode {
  const { t } = useTranslation();
  const id = Number(accountId);
  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--surface-panel)]" data-profile-panel="">
      <LayerHeader title={t("contact.open_profile")} />
      <div className="px-[var(--space-list-x)] py-[var(--space-4)]">
        {Number.isFinite(id) ? <AccountProfile accountId={id} /> : null}
      </div>
    </div>
  );
}

function DemoProfile({ conversationId }: { conversationId: string }): ReactNode {
  const { t } = useTranslation();
  const conversation = conversationById(conversationId);
  if (!conversation) {
    return null;
  }
  return <ProfileBody conversationId={conversationId} name={conversation.name} subtitle={t("shell.profile_subtitle")} />;
}

function LiveProfile({ conversationId }: { conversationId: number }): ReactNode {
  const { t } = useTranslation();
  const query = useConversation(conversationId);
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
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
  const reportSubject =
    query.data.kind === "direct" && query.data.peer
      ? { subjectId: query.data.peer.id, subjectType: "account" as const }
      : { subjectId: conversationId, subjectType: "conversation" as const };
  return (
    <ProfileBody
      conversationId={String(conversationId)}
      name={conversationTitle(query.data, t("conversations.untitled"))}
      subtitle={t("shell.profile_subtitle")}
    >
      {canManageInvites(query.data.kind, query.data.role) ? (
        <InviteManager conversationId={conversationId} />
      ) : null}
      {canEditInfo(query.data.kind, query.data.role, query.data.permissions?.edit_info !== false) ? (
        <GroupPermissions conversation={query.data} />
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
      {query.data.kind === "direct" && query.data.peer ? (
        <div className="px-[var(--space-list-x)]">
          <AccountProfile accountId={query.data.peer.id} />
        </div>
      ) : null}
      <Button
        className="mx-[var(--space-list-x)]"
        onClick={() => setReportOpen(true)}
        type="button"
        variant="danger"
      >
        {t("report.action")}
      </Button>
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
      <ReportHost
        onOpenChange={setReportOpen}
        open={reportOpen}
        subjectId={reportSubject.subjectId}
        subjectType={reportSubject.subjectType}
      />
    </ProfileBody>
  );
}

function ProfileBody({
  children,
  conversationId,
  name,
  subtitle,
}: {
  children?: ReactNode;
  conversationId: string;
  name: string;
  subtitle: string;
}) {
  const { t } = useTranslation();
  const pushLayer = useLayerStore((state) => state.pushLayer);
  const liveId = parseConversationId(conversationId);
  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--surface-panel)]" data-profile-panel="">
      <LayerHeader title={name} />
      <div className="flex flex-col items-center gap-[var(--control-gap)] px-[var(--space-list-x)] py-[var(--space-8)]">
        <Avatar className="size-[var(--space-16)]" name={name} />
        <p className="[font-weight:var(--font-weight-emphasis)]">{name}</p>
        <p className="text-[var(--text-secondary)]">{subtitle}</p>
        <Button
          onClick={() =>
            pushLayer({
              conversationId,
              id: `gallery:${conversationId}`,
              kind: "gallery",
              title: t("media.gallery_title"),
            })
          }
          type="button"
          variant="secondary"
        >
          {t("media.gallery_title")}
        </Button>
      </div>
      {liveId != null ? (
        <div className="px-[var(--space-list-x)]">
          <WallpaperPicker conversationId={liveId} />
        </div>
      ) : null}
      {children}
    </div>
  );
}
