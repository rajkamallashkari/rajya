import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ProfilePanel } from "@/features/conversations/components/profile-panel";
import { useCallLog } from "@/features/calls/api/queries";
import { CallLogItem } from "@/features/calls/components/call-log-item";
import { callContactLayer } from "@/features/calls/model/log";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { useShellStore } from "@/features/settings/store/shell-store";
import { useLayer } from "@/shared/hooks/use-layer";
import { useMobileViewport } from "@/shared/hooks/use-mobile-viewport";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { ListView } from "@/shared/ui/list-view";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export const CALLS_CONTACT_LAYER_ID = "calls-contact";

export function CallsDestination(): ReactNode {
  const { t } = useTranslation();
  const query = useCallLog();
  const viewerId = useAccountsStore((state) => state.activeAccountId) ?? 0;
  const contact = useShellStore((state) => state.callsContact);
  const setCallsContact = useShellStore((state) => state.setCallsContact);
  const mobile = useMobileViewport();
  useLayer(CALLS_CONTACT_LAYER_ID, contact != null, (open) => {
    if (!open) {
      setCallsContact(null);
    }
  });
  const rows = query.data?.pages.flatMap((page) => page.calls) ?? [];
  const status = query.isPending ? "loading" : query.isError ? "error" : rows.length === 0 ? "empty" : "ready";
  const lastPage = query.data?.pages.at(-1);

  return (
    <div
      className={cn("layer-host min-h-0 flex-1", mobile ? "layer-host-mobile" : "layer-host-desktop")}
      data-destination="calls"
    >
      <div className="layer-chat-column min-h-0 min-w-0 flex-1">
        <section
          aria-labelledby="destination-calls-title"
          className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-[var(--surface-panel)]"
        >
          <header className="flex items-center px-[var(--space-list-x)] py-[var(--space-list-y)]">
            <h1 className={WEIGHT_EMPHASIS} id="destination-calls-title">
              {t("shell.calls")}
            </h1>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ListView
              onRetry={() => void query.refetch()}
              status={status === "empty" ? "ready" : status}
            >
              {status === "empty" ? (
                <EmptyState description={t("calls.empty_description")} title={t("calls.empty")} />
              ) : (
                rows.map((row) => (
                  <CallLogItem
                    key={row.id}
                    onOpen={() => setCallsContact(callContactLayer(row, viewerId))}
                    row={row}
                  />
                ))
              )}
              {lastPage?.meta.has_more ? (
                <div className="px-[var(--space-list-x)] py-[var(--space-list-y)]">
                  <Button
                    onClick={() => void query.fetchNextPage()}
                    type="button"
                    variant="secondary"
                  >
                    {t("calls.load_more")}
                  </Button>
                </div>
              ) : null}
            </ListView>
          </div>
        </section>
        {contact ? (
          <div className="layer-overlay-stack" data-layer-column="overlay">
            <section
              className={cn("layer-frame", mobile ? "layer-frame-mobile" : "layer-frame-overlay")}
              data-layer="profile"
              data-layer-top="true"
            >
              <ProfilePanel
                accountId={contact.accountId}
                conversationId={contact.conversationId}
                onBack={() => setCallsContact(null)}
              />
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
