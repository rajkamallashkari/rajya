import { Pencil, Plus, Power, RotateCcw, X } from "lucide-react";
import { lazy, Suspense, type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Bot, BotRequest } from "@/features/bots/api/http";
import {
  useBotRequests,
  useDeactivateBot,
  useOwnedBots,
  useWithdrawBotRequest,
} from "@/features/bots/api/queries";
import { ChunkFallback } from "@/shared/ui/chunk-fallback";
import { loadBotBuilderForm } from "@/shared/lib/chunks";
import { Avatar, Button, EmptyState, IconButton, ListView } from "@/shared/ui";
import { ICON_CLASS, WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

void loadBotBuilderForm();

const BotBuilderForm = lazy(() =>
  loadBotBuilderForm().then((mod) => ({ default: mod.BotBuilderForm })),
);

export function BotsPanel(): ReactNode {
  const { t } = useTranslation();
  const owned = useOwnedBots();
  const requests = useBotRequests();
  const withdraw = useWithdrawBotRequest();
  const deactivate = useDeactivateBot();
  const [editor, setEditor] = useState<
    { bot?: Bot; draft?: BotRequest; request?: BotRequest } | undefined
  >();
  const [confirmBotId, setConfirmBotId] = useState<number | null>(null);
  const bots = owned.data?.bots ?? [];
  const submitted = (requests.data?.bot_requests ?? []).filter((row) =>
    ["pending", "declined"].includes(row.status),
  );
  const pendingTargets = new Set(
    submitted
      .filter((row) => row.kind === "edit" && row.status === "pending")
      .map((row) => row.target_bot_id),
  );

  if (editor) {
    return (
      <div data-bots-panel="">
        <Suspense fallback={<ChunkFallback />}>
          <BotBuilderForm
            bot={editor.bot}
            draft={editor.draft}
            onCancel={() => setEditor(undefined)}
            onSaved={() => setEditor(undefined)}
            request={editor.request}
          />
        </Suspense>
      </div>
    );
  }

  const status =
    owned.isPending || requests.isPending
      ? "loading"
      : owned.isError || requests.isError
        ? "error"
        : "ready";

  return (
    <div className="flex flex-col gap-[var(--space-4)]" data-bots-panel="">
      <div className="flex items-center">
        <h2 className={WEIGHT_EMPHASIS}>{t("bots.mine")}</h2>
        <span className="flex-1" />
        <IconButton aria-label={t("bots.add")} onClick={() => setEditor({})} type="button">
          <Plus aria-hidden="true" className={ICON_CLASS} />
        </IconButton>
      </div>
      <ListView
        onRetry={() => {
          void owned.refetch();
          void requests.refetch();
        }}
        status={status}
      >
        {bots.length === 0 && submitted.length === 0 ? (
          <EmptyState
            description={t("bots.manage_empty_description")}
            title={t("bots.manage_empty")}
          />
        ) : (
          <>
            <ul className="flex flex-col gap-[var(--space-2)]">
              {bots.map((bot) => (
                <li className="flex items-center gap-[var(--control-gap)]" key={bot.id}>
                  <Avatar name={bot.account.display_name} src={bot.account.avatar_url} />
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate ${WEIGHT_EMPHASIS}`}>
                      {bot.account.display_name}
                    </span>
                    <span className="block truncate text-[var(--text-secondary)]">
                      @{bot.account.username}
                    </span>
                  </span>
                  <IconButton
                    aria-label={t("bots.edit_named", { name: bot.account.display_name })}
                    disabled={pendingTargets.has(bot.id)}
                    onClick={() => setEditor({ bot })}
                    type="button"
                  >
                    <Pencil aria-hidden="true" className={ICON_CLASS} />
                  </IconButton>
                  {confirmBotId === bot.id ? (
                    <Button
                      onClick={() => {
                        deactivate.mutate(bot.id);
                        setConfirmBotId(null);
                      }}
                      type="button"
                      variant="danger"
                    >
                      {t("bots.deactivate_confirm")}
                    </Button>
                  ) : (
                    <IconButton
                      aria-label={t("bots.deactivate_named", { name: bot.account.display_name })}
                      onClick={() => setConfirmBotId(bot.id)}
                      type="button"
                    >
                      <Power aria-hidden="true" className={ICON_CLASS} />
                    </IconButton>
                  )}
                </li>
              ))}
            </ul>
            {submitted.length > 0 ? (
              <section
                aria-labelledby="bot-requests-title"
                className="flex flex-col gap-[var(--space-2)]"
              >
                <h3 className={WEIGHT_EMPHASIS} id="bot-requests-title">
                  {t("bots.requests")}
                </h3>
                <ul className="flex flex-col gap-[var(--space-2)]">
                  {submitted.map((row) => (
                    <li className="flex items-center gap-[var(--control-gap)]" key={row.id}>
                      <Avatar
                        name={row.payload.name ?? row.payload.username ?? t("bots.builder")}
                        src={row.avatar_url}
                      />
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate ${WEIGHT_EMPHASIS}`}>
                          {row.payload.name ?? row.payload.username ?? t("bots.builder")}
                        </span>
                        <span className="text-[var(--text-secondary)]">
                          {t(`bots.status_${row.status}`)}
                          {row.decline_reason ? ` · ${row.decline_reason}` : ""}
                        </span>
                      </span>
                      {row.status === "pending" ? (
                        <IconButton
                          aria-label={t("bots.edit_request")}
                          onClick={() => setEditor({ request: row })}
                          type="button"
                        >
                          <Pencil aria-hidden="true" className={ICON_CLASS} />
                        </IconButton>
                      ) : (
                        <IconButton
                          aria-label={t("bots.re_request")}
                          onClick={() =>
                            setEditor({
                              bot: bots.find((bot) => bot.id === row.target_bot_id),
                              request: row,
                            })
                          }
                          type="button"
                        >
                          <RotateCcw aria-hidden="true" className={ICON_CLASS} />
                        </IconButton>
                      )}
                      <IconButton
                        aria-label={t("bots.withdraw")}
                        onClick={() => withdraw.mutate(row.id)}
                        type="button"
                      >
                        <X aria-hidden="true" className={ICON_CLASS} />
                      </IconButton>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        )}
      </ListView>
    </div>
  );
}
