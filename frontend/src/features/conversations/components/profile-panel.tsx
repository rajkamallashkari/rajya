import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { AccountProfile } from "@/features/auth/components/account-profile";
import type { Conversation } from "@/features/conversations/api/http";
import { conversationKeys } from "@/features/conversations/api/keys";
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
import { conversationLayer, useLayerStore } from "@/shared/lib/navigation/layer-store";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { ListView } from "@/shared/ui/list-view";

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
  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--surface-panel)]" data-profile-panel="">
      <LayerHeader onBack={onBack} title={t("contact.open_profile")} />
      <div className="min-h-0 flex-1 overflow-y-auto px-[var(--space-list-x)] py-[var(--space-4)]">
        {Number.isFinite(id) ? (
          <div className="flex flex-col gap-[var(--space-6)]">
            <AccountProfile accountId={id} />
            <CommonGroups accountId={id} />
          </div>
        ) : null}
      </div>
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
        <div className="flex flex-col gap-[var(--space-6)] px-[var(--space-list-x)]">
          <AccountProfile accountId={query.data.peer.id} />
          <CommonGroups accountId={query.data.peer.id} />
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
  const pushLayer = useLayerStore((state) => state.pushLayer);
  return (
    <section
      className="flex flex-col gap-[var(--space-2)] px-[var(--space-list-x)]"
      data-profile-members=""
    >
      <p className="[font-weight:var(--font-weight-emphasis)]">
        {t("conversations.profile.members", { count: members.length })}
      </p>
      {members.map((member) => (
        <Button
          className="h-auto justify-start gap-[var(--space-3)] px-[var(--space-2)]"
          key={member.account.id}
          onClick={() =>
            pushLayer({
              accountId: String(member.account.id),
              conversationId: "0",
              id: `account:${String(member.account.id)}`,
              kind: "profile",
              title: member.account.display_name,
            })
          }
          type="button"
          variant="ghost"
        >
          <Avatar className="size-[var(--space-8)]" name={member.account.display_name} />
          <span className="min-w-0 text-left">
            <span className="block truncate">{member.account.display_name}</span>
            <span className="block truncate text-[length:var(--text-sm)] text-[var(--text-secondary)]">
              @{member.account.username}
            </span>
          </span>
        </Button>
      ))}
    </section>
  );
}

type ConversationList = { conversations: Conversation[] };

export function commonGroupsFromCache(queryClient: QueryClient, accountId: number): Conversation[] {
  const list =
    queryClient.getQueryData<ConversationList>(conversationKeys.list())?.conversations ?? [];
  const details = queryClient
    .getQueriesData<Conversation>({ queryKey: conversationKeys.all })
    .map(([, conversation]) => conversation)
    .filter((conversation): conversation is Conversation => conversation != null);
  const byId = new Map(list.map((conversation) => [conversation.id, conversation]));
  details.forEach((conversation) => {
    byId.set(conversation.id, conversation);
  });
  return [...byId.values()].filter(
    (conversation) =>
      (conversation.kind === "group" || conversation.kind === "channel") &&
      conversation.members.some((member) => member.account.id === accountId),
  );
}

function CommonGroups({ accountId }: { accountId: number }): ReactNode {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const openConversation = useLayerStore((state) => state.openConversation);
  const [, refresh] = useReducer((count: number) => count + 1, 0);
  useEffect(
    () =>
      queryClient.getQueryCache().subscribe((event) => {
        if (event.query.queryKey[0] === conversationKeys.all[0]) {
          refresh();
        }
      }),
    [queryClient],
  );
  const groups = commonGroupsFromCache(queryClient, accountId);
  if (groups.length === 0) {
    return null;
  }
  return (
    <section className="flex flex-col gap-[var(--space-2)]" data-common-groups="">
      <p className="[font-weight:var(--font-weight-emphasis)]">
        {t("conversations.profile.common_groups")}
      </p>
      {groups.map((group) => {
        const title = conversationTitle(group, t("conversations.untitled"));
        return (
          <Button
            className="h-auto justify-start gap-[var(--space-3)] px-[var(--space-2)]"
            key={group.id}
            onClick={() => openConversation(conversationLayer(String(group.id), title))}
            type="button"
            variant="ghost"
          >
            <Avatar className="size-[var(--space-8)]" name={title} />
            <span className="truncate">{title}</span>
          </Button>
        );
      })}
    </section>
  );
}

function ProfileBody({
  children,
  conversationId,
  name,
  onBack,
  subtitle,
}: {
  children?: ReactNode;
  conversationId: string;
  name: string;
  onBack?: () => void;
  subtitle: string;
}) {
  const { t } = useTranslation();
  const pushLayer = useLayerStore((state) => state.pushLayer);
  const liveId = parseConversationId(conversationId);
  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--surface-panel)]" data-profile-panel="">
      <LayerHeader onBack={onBack} title={name} />
      <div className="flex min-h-0 flex-1 flex-col gap-[var(--space-6)] overflow-y-auto pb-[var(--space-8)]">
        <div className="flex flex-col items-center gap-[var(--control-gap)] px-[var(--space-list-x)] pt-[var(--space-8)]">
          <Avatar className="size-[var(--space-16)]" name={name} />
          <p className="[font-weight:var(--font-weight-emphasis)]">{name}</p>
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
