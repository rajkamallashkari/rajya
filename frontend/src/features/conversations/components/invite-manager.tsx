import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  approveJoinRequest,
  createInvite,
  listInvites,
  listJoinRequests,
  rejectJoinRequest,
  revokeInvite,
} from "@/features/conversations/api/http";
import { conversationKeys, inviteKeys } from "@/features/conversations/api/keys";
import { QrSheet } from "@/features/conversations/components/qr-sheet";
import { inviteUrl } from "@/features/conversations/model/links";
import { copyText } from "@/features/messages/model/copy-text";
import { Button } from "@/shared/ui/button";

export function InviteManager({ conversationId }: { conversationId: number }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const invites = useQuery({
    queryFn: () => listInvites(conversationId),
    queryKey: inviteKeys.list(conversationId),
  });
  const requests = useQuery({
    queryFn: () => listJoinRequests(conversationId),
    queryKey: inviteKeys.joinRequests(conversationId),
  });
  const create = useMutation({
    mutationFn: () => createInvite(conversationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inviteKeys.list(conversationId) });
    },
  });
  const revoke = useMutation({
    mutationFn: (id: number) => revokeInvite(conversationId, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inviteKeys.list(conversationId) });
    },
  });
  const approve = useMutation({
    mutationFn: (id: number) => approveJoinRequest(conversationId, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inviteKeys.joinRequests(conversationId) });
      await queryClient.invalidateQueries({ queryKey: conversationKeys.detail(conversationId) });
    },
  });
  const reject = useMutation({
    mutationFn: (id: number) => rejectJoinRequest(conversationId, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inviteKeys.joinRequests(conversationId) });
    },
  });
  const origin = globalThis.location.origin;
  const rows = invites.data?.invites ?? [];
  const pending = requests.data?.join_requests ?? [];

  return (
    <div className="flex flex-col gap-[var(--space-4)] px-[var(--space-list-x)]" data-invite-manager="">
      <p className="[font-weight:var(--font-weight-emphasis)]">{t("invites.manage")}</p>
      {rows.length === 0 ? <p className="text-[var(--text-secondary)]">{t("invites.empty")}</p> : null}
      {rows.map((invite) => (
        <div className="flex flex-col gap-[var(--space-2)]" key={invite.id}>
          <p className="text-[var(--text-secondary)]">
            {invite.max_uses == null
              ? t("invites.unlimited")
              : t("invites.uses", { used: invite.uses_count, max: invite.max_uses })}
          </p>
          {invite.requires_approval ? (
            <p className="text-[var(--text-secondary)]">{t("invites.approval")}</p>
          ) : null}
          <div className="flex flex-wrap gap-[var(--space-2)]">
            <Button
              onClick={() => {
                void copyText(inviteUrl(origin, invite.token));
              }}
              size="sm"
              type="button"
              variant="secondary"
            >
              {t("invites.copy")}
            </Button>
            <Button
              onClick={() => setQrPayload(inviteUrl(origin, invite.token))}
              size="sm"
              type="button"
              variant="secondary"
            >
              {t("invites.show_qr")}
            </Button>
            <Button
              onClick={() => revoke.mutate(invite.id)}
              size="sm"
              type="button"
              variant="danger"
            >
              {t("invites.revoke")}
            </Button>
          </div>
        </div>
      ))}
      <Button disabled={create.isPending} onClick={() => create.mutate()} type="button">
        {t("invites.create")}
      </Button>
      <p className="[font-weight:var(--font-weight-emphasis)]">{t("invites.requests")}</p>
      {pending.length === 0 ? (
        <p className="text-[var(--text-secondary)]">{t("invites.no_requests")}</p>
      ) : (
        pending.map((request) => (
          <div className="flex items-center justify-between gap-[var(--space-2)]" key={request.id}>
            <p>{request.account.display_name}</p>
            <div className="flex gap-[var(--space-2)]">
              <Button onClick={() => approve.mutate(request.id)} size="sm" type="button">
                {t("invites.approve")}
              </Button>
              <Button
                onClick={() => reject.mutate(request.id)}
                size="sm"
                type="button"
                variant="secondary"
              >
                {t("invites.reject")}
              </Button>
            </div>
          </div>
        ))
      )}
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
    </div>
  );
}
