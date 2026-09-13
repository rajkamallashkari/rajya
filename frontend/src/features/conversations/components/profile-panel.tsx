import { useQuery } from "@tanstack/react-query";
import { Share2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchCommonGroups } from "@/features/auth/api/identity";
import {
  AccountIdentity,
  AccountProfile,
  AccountProfileActions,
  useAccountProfile,
} from "@/features/auth/components/account-profile";
import type { Conversation } from "@/features/conversations/api/http";
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
import { AccountIdentityRow } from "@/shared/ui/account-identity-row";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { ConversationIdentityRow } from "@/shared/ui/conversation-identity-row";
import { IconButton } from "@/shared/ui/icon-button";
import { ListView } from "@/shared/ui/list-view";
import { ICON_CLASS } from "@/shared/ui/metrics";

export function ProfilePanel({
  accountId,
  conversationId,
  onBack,
}: {
  accountId?: string;
  conversationId: string;
  onBack?: () => void;
}): ReactNode {
  if (accountId) {
    return <AccountContactProfile accountId={accountId} onBack={onBack} />;
  }
  const liveId = parseConversationId(conversationId);
  if (liveId == null) {
    return <DemoProfile conversationId={conversationId} onBack={onBack} />;
  }
  return <LiveProfile conversationId={liveId} onBack={onBack} />;
}

function AccountContactProfile({
  accountId,
  onBack,
}: {
  accountId: string;
  onBack?: () => void;
}): ReactNode {
  const { t } = useTranslation();
  const id = Number(accountId);
  const profile = useAccountProfile(Number.isFinite(id) ? id : null);
  const [qrOpen, setQrOpen] = useState(false);
  const url = profile.username ? profileUrl(globalThis.location.origin, profile.username) : "";
  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--surface-panel)]" data-profile-panel="">
      <LayerHeader onBack={onBack} title={t("contact.open_profile")}>
        {url ? <ProfileShareButton onClick={() => setQrOpen(true)} /> : null}
      </LayerHeader>
      <div className="min-h-0 flex-1 overflow-y-auto px-[var(--space-list-x)] py-[var(--space-4)]">
        {Number.isFinite(id) ? (
          <div className="flex flex-col gap-[var(--space-6)]">
            <AccountProfile accountId={id} />
            <CommonGroups accountId={id} />
          </div>
        ) : null}
      </div>
      <QrSheet
        onCopy={() => void copyText(url)}
        onOpenChange={setQrOpen}
        open={qrOpen}
        payload={url}
      />
    </div>
  );
}

function DemoProfile({
  conversationId,
  onBack,
}: {
  conversationId: string;
  onBack?: () => void;
}): ReactNode {
  const { t } = useTranslation();
  const conversation = conversationById(conversationId);
  if (!conversation) {
    return null;
  }
  return (
    <ProfileBody
      conversationId={conversationId}
      name={conversation.name}
      onBack={onBack}
      subtitle={t("shell.profile_subtitle")}
    />
  );
}

function LiveProfile({
  conversationId,
  onBack,
}: {
  conversationId: number;
  onBack?: () => void;
}): ReactNode {
  const { t } = useTranslation();
  const query = useConversation(conversationId);
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const peerId = query.data?.kind === "direct" && query.data.peer ? query.data.peer.id : null;
  const peerProfile = useAccountProfile(peerId);
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
      onBack={onBack}
      subtitle={t("shell.profile_subtitle")}
      headerActions={
        username ? (
          <ProfileShareButton
            onClick={() => setQrPayload(profileUrl(globalThis.location.origin, username))}
          />
        ) : null
      }
      topIdentity={
        peerId != null && !peerProfile.missing ? (
          <AccountIdentity profile={peerProfile} showName={false} />
        ) : null
      }
    >
      {query.data.kind === "group" || query.data.kind === "channel" ? (
        <MemberList members={query.data.members} />
      ) : null}
      {canManageInvites(query.data.kind, query.data.role) ? (
        <InviteManager conversationId={conversationId} />
      ) : null}
      {canEditInfo(
        query.data.kind,
        query.data.role,
        query.data.permissions?.edit_info !== false,
      ) ? (
        <GroupPermissions conversation={query.data} />
      ) : null}
      {query.data.kind === "direct" && query.data.peer ? (
        <div className="flex flex-col gap-[var(--space-6)] px-[var(--space-list-x)]">
          <CommonGroups accountId={query.data.peer.id} />
          <AccountProfileActions profile={peerProfile} />
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

function MemberList({ members }: { members: Conversation["members"] }): ReactNode {
  const { t } = useTranslation();
  return (
    <section
      className="flex flex-col gap-[var(--space-2)] px-[var(--space-list-x)]"
      data-profile-members=""
    >
      <p className="[font-weight:var(--font-weight-emphasis)]">
        {t("conversations.profile.members", { count: members.length })}
      </p>
      {members.map((member) => (
        <AccountIdentityRow account={member.account} key={member.account.id} openProfile />
      ))}
    </section>
  );
}

function CommonGroups({ accountId }: { accountId: number }): ReactNode {
  const { t } = useTranslation();
  const groupsQuery = useQuery({
    queryKey: ["accounts", accountId, "common-groups"],
    queryFn: () => fetchCommonGroups(accountId),
  });
  const groups = groupsQuery.data?.conversations ?? [];
  if (groups.length === 0) {
    return null;
  }
  return (
    <section className="flex flex-col gap-[var(--space-2)]" data-common-groups="">
      <p className="[font-weight:var(--font-weight-emphasis)]">
        {t("conversations.profile.common_groups")}
      </p>
      {groups.map((group) => (
        <ConversationIdentityRow compact conversation={group} key={group.id} openConversation />
      ))}
    </section>
  );
}

function ProfileBody({
  children,
  conversationId,
  headerActions,
  name,
  onBack,
  subtitle,
  topIdentity,
}: {
  children?: ReactNode;
  conversationId: string;
  headerActions?: ReactNode;
  name: string;
  onBack?: () => void;
  subtitle: string;
  topIdentity?: ReactNode;
}) {
  const { t } = useTranslation();
  const pushLayer = useLayerStore((state) => state.pushLayer);
  const liveId = parseConversationId(conversationId);
  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--surface-panel)]" data-profile-panel="">
      <LayerHeader onBack={onBack} title={name}>
        {headerActions}
      </LayerHeader>
      <div className="flex min-h-0 flex-1 flex-col gap-[var(--space-6)] overflow-y-auto pb-[var(--space-8)]">
        <div className="flex flex-col items-center gap-[var(--control-gap)] px-[var(--space-list-x)] pt-[var(--space-8)]">
          <Avatar className="size-[var(--space-16)]" name={name} />
          <p className="[font-weight:var(--font-weight-emphasis)]">{name}</p>
          {topIdentity ? (
            <div className="w-full" data-top-profile-identity="">
              {topIdentity}
            </div>
          ) : null}
          <p className="text-[var(--text-secondary)]">{subtitle}</p>
          {onBack ? null : (
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
          )}
        </div>
        {liveId != null ? (
          <div className="px-[var(--space-list-x)]">
            <WallpaperPicker conversationId={liveId} />
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

function ProfileShareButton({ onClick }: { onClick: () => void }): ReactNode {
  const { t } = useTranslation();
  return (
    <IconButton
      aria-label={t("auth.profile.share")}
      onClick={onClick}
      title={t("auth.profile.share")}
      type="button"
    >
      <Share2 className={ICON_CLASS} />
    </IconButton>
  );
}
