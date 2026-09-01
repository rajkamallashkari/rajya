import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { getAccessSession } from "@/features/auth/model/access-session";
import { getInvitePreview, joinViaInvite } from "@/features/conversations/api/http";
import { inviteKeys } from "@/features/conversations/api/keys";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { ListView } from "@/shared/ui/list-view";

export function inviteActionLabel(preview: {
  already_member: boolean;
  kind: string;
  pending_request: boolean;
  requires_approval: boolean;
}): "open" | "pending" | "request" | "follow" | "join" {
  if (preview.already_member) {
    return "open";
  }
  if (preview.pending_request) {
    return "pending";
  }
  if (preview.requires_approval) {
    return "request";
  }
  return preview.kind === "channel" ? "follow" : "join";
}

export function InvitePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = useParams<{ token: string }>().token ?? "";
  const signedIn = getAccessSession() != null;
  const preview = useQuery({
    enabled: Boolean(token),
    queryFn: () => getInvitePreview(token),
    queryKey: inviteKeys.preview(token),
  });
  const join = useMutation({
    mutationFn: () => joinViaInvite(token),
    onSuccess: (data) => {
      if (data.status === "pending_approval") {
        void preview.refetch();
        return;
      }
      const id = data.conversation?.id ?? preview.data?.conversation_id;
      if (id != null) {
        navigate(`/c/${String(id)}`, { replace: true });
      }
    },
  });

  if (!token || preview.isError) {
    return (
      <main
        className="flex min-h-full items-center justify-center p-[var(--space-6)]"
        data-invite-page=""
      >
        <div className="flex w-full max-w-[var(--sheet-min-height)] flex-col items-center gap-[var(--space-4)] text-center">
          <h1 className="[font-weight:var(--font-weight-emphasis)]">
            {t("invites.invalid_title")}
          </h1>
          <p className="text-[var(--text-secondary)]">{t("invites.invalid")}</p>
          <Button onClick={() => navigate("/")} type="button" variant="secondary">
            {t("invites.go_home")}
          </Button>
        </div>
      </main>
    );
  }

  if (preview.isPending || !preview.data) {
    return (
      <main className="flex min-h-full items-center justify-center" data-invite-page="">
        <h1 className="sr-only">{t("app.loading")}</h1>
        <ListView status="loading">{null}</ListView>
      </main>
    );
  }

  const data = preview.data;
  const action = inviteActionLabel(data);
  const canJoin = data.usable || data.already_member || data.pending_request;
  const labels = {
    follow: t("invites.follow"),
    join: t("invites.join"),
    open: t("invites.open"),
    pending: t("invites.pending"),
    request: t("invites.request"),
  };

  return (
    <main
      className="flex min-h-full items-center justify-center p-[var(--space-6)]"
      data-invite-page=""
    >
      <div className="flex w-full max-w-[var(--sheet-min-height)] flex-col gap-[var(--space-4)]">
        <div className="flex flex-col items-center gap-[var(--space-3)]">
          <Avatar name={data.title} src={data.avatar_url} />
          <h1 className="text-center [font-weight:var(--font-weight-emphasis)]">
            {data.title ?? t("conversations.untitled")}
          </h1>
          {data.kind === "channel" ? (
            <p className="text-[var(--text-secondary)]">{t("invites.channel")}</p>
          ) : null}
          <p className="text-[var(--text-secondary)]">
            {t("invites.members", { count: data.member_count })}
          </p>
        </div>
        {data.pending_request ? (
          <p className="text-[var(--text-secondary)]">{t("invites.pending_notice")}</p>
        ) : null}
        {!data.pending_request && data.requires_approval && !data.already_member ? (
          <p className="text-[var(--text-secondary)]">{t("invites.approval_notice")}</p>
        ) : null}
        {!data.usable && !data.already_member ? (
          <p className="text-[var(--status-danger)]">{t("invites.inactive")}</p>
        ) : null}
        {join.isError ? (
          <p className="text-[var(--status-danger)]">{t("invites.join_failed")}</p>
        ) : null}
        {canJoin && signedIn ? (
          <Button
            disabled={join.isPending || data.pending_request}
            onClick={() => {
              if (data.already_member && data.conversation_id != null) {
                navigate(`/c/${String(data.conversation_id)}`, { replace: true });
                return;
              }
              join.mutate();
            }}
            type="button"
          >
            {join.isPending ? t("invites.joining") : labels[action]}
          </Button>
        ) : null}
        {canJoin && !signedIn && data.usable ? (
          <Button onClick={() => navigate("/")} type="button">
            {t("invites.sign_in")}
          </Button>
        ) : null}
        <Button onClick={() => navigate("/")} type="button" variant="ghost">
          {t("invites.go_home")}
        </Button>
      </div>
    </main>
  );
}
