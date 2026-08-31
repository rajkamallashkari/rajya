import { useState, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { getAccessSession } from "@/features/auth/model/access-session";
import {
  useConversations,
  useCreateSavedReply,
  useDestroySavedReply,
  useSavedReplies,
  useUpdateSavedReply,
} from "@/features/conversations/api/queries";
import { conversationTitle } from "@/features/conversations/model/title";
import { usePeopleSearch } from "@/features/search/api/queries";
import { useDebouncedValue } from "@/features/search/hooks/use-debounced-value";
import { SEARCH_DEBOUNCE_MS } from "@/features/search/model/constants";
import {
  useContactNicknames,
  useCreateExportJob,
  useDestroyContactNickname,
  useDownloadExportJob,
  useExportJobs,
  usePreferences,
  useUpdatePreferences,
  useUpsertContactNickname,
} from "@/features/settings/api/queries";
import {
  EXPORT_ALL_CONVERSATIONS,
  EXPORT_FORMATS,
  type ExportFormat,
} from "@/features/settings/model/constants";
import { asPreferenceDocument } from "@/features/settings/model/map-preferences";
import {
  exportableConversations,
  nicknameSearchHits,
  queryListStatus,
} from "@/features/settings/model/map-sessions";
import {
  Button,
  Checkbox,
  Input,
  ListView,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from "@/shared/ui";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export function ChatsPanel() {
  const { t } = useTranslation();
  const preferences = usePreferences();
  const update = useUpdatePreferences();
  const document = asPreferenceDocument(preferences.data?.data);
  const transcription = document?.chat?.voice_transcription_enabled ?? true;
  const linkPreviews = document?.chat?.link_previews_enabled ?? true;
  return (
    <div className="flex flex-col gap-[var(--space-6)]" data-chats-panel="">
      <section className="flex flex-col gap-[var(--control-gap)]">
        <label className="flex min-h-[var(--control-height)] items-center justify-between gap-[var(--control-gap)]">
          <span>{t("settings.transcription")}</span>
          <Switch
            aria-label={t("settings.transcription")}
            checked={transcription}
            onCheckedChange={(checked) =>
              update.mutate({ chat: { voice_transcription_enabled: checked } })
            }
          />
        </label>
        <label className="flex min-h-[var(--control-height)] items-center justify-between gap-[var(--control-gap)]">
          <span>{t("settings.link_previews")}</span>
          <Switch
            aria-label={t("settings.link_previews")}
            checked={linkPreviews}
            onCheckedChange={(checked) =>
              update.mutate({ chat: { link_previews_enabled: checked } })
            }
          />
        </label>
      </section>
      <SavedRepliesManager />
      <NicknamesManager />
      <ExportJobsManager />
    </div>
  );
}

function SavedRepliesManager(): ReactNode {
  const { t } = useTranslation();
  const replies = useSavedReplies();
  const create = useCreateSavedReply();
  const update = useUpdateSavedReply();
  const destroy = useDestroySavedReply();
  const [shortcut, setShortcut] = useState("");
  const [body, setBody] = useState("");
  const rows = replies.data?.saved_replies ?? [];

  function onCreate(event: FormEvent): void {
    event.preventDefault();
    const nextShortcut = shortcut.trim();
    const nextBody = body.trim();
    if (!nextShortcut || !nextBody) {
      return;
    }
    create.mutate(
      { shortcut: nextShortcut, body: nextBody },
      {
        onSuccess: () => {
          setShortcut("");
          setBody("");
        },
      },
    );
  }

  return (
    <section className="flex flex-col gap-[var(--control-gap)]">
      <h2 className={WEIGHT_EMPHASIS}>{t("settings.saved_replies.title")}</h2>
      <form className="flex flex-col gap-[var(--control-gap)]" onSubmit={onCreate}>
        <Input
          aria-label={t("settings.saved_replies.shortcut")}
          onChange={(event) => setShortcut(event.target.value)}
          placeholder={t("settings.saved_replies.shortcut")}
          value={shortcut}
        />
        <Textarea
          aria-label={t("settings.saved_replies.body")}
          onChange={(event) => setBody(event.target.value)}
          placeholder={t("settings.saved_replies.body")}
          value={body}
        />
        <Button type="submit">{t("settings.saved_replies.add")}</Button>
      </form>
      <ListView
        onRetry={() => {
          void replies.refetch();
        }}
        status={queryListStatus(replies.isPending, replies.isError, rows.length === 0)}
      >
        <ul className="flex flex-col gap-[var(--control-gap)]">
          {rows.map((reply) => (
            <li className="flex flex-col gap-[var(--space-2)]" key={reply.id}>
              <Input
                aria-label={t("settings.saved_replies.shortcut")}
                defaultValue={reply.shortcut}
                onBlur={(event) => {
                  const next = event.target.value.trim();
                  if (next && next !== reply.shortcut) {
                    update.mutate({ id: reply.id, shortcut: next });
                  }
                }}
              />
              <Textarea
                aria-label={t("settings.saved_replies.body")}
                defaultValue={reply.body}
                onBlur={(event) => {
                  const next = event.target.value.trim();
                  if (next && next !== reply.body) {
                    update.mutate({ id: reply.id, body: next });
                  }
                }}
              />
              <Button
                onClick={() => destroy.mutate(reply.id)}
                type="button"
                variant="danger"
              >
                {t("settings.saved_replies.delete")}
              </Button>
            </li>
          ))}
        </ul>
      </ListView>
    </section>
  );
}

function NicknamesManager(): ReactNode {
  const { t } = useTranslation();
  const nicknames = useContactNicknames();
  const upsert = useUpsertContactNickname();
  const destroy = useDestroyContactNickname();
  const ownerId = getAccessSession()?.accountId;
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const debounced = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const people = usePeopleSearch(debounced);
  const rows = nicknames.data?.nicknames ?? [];
  const hits = nicknameSearchHits(people.data?.accounts ?? [], ownerId);

  function onAdd(event: FormEvent): void {
    event.preventDefault();
    const nickname = draft.trim();
    if (selectedId == null || !nickname) {
      return;
    }
    upsert.mutate(
      { accountId: selectedId, nickname },
      {
        onSuccess: () => {
          setDraft("");
          setQuery("");
          setSelectedId(null);
        },
      },
    );
  }

  return (
    <section className="flex flex-col gap-[var(--control-gap)]">
      <h2 className={WEIGHT_EMPHASIS}>{t("settings.nicknames.title")}</h2>
      <form className="flex flex-col gap-[var(--control-gap)]" onSubmit={onAdd}>
        <Input
          aria-label={t("settings.nicknames.search")}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("settings.nicknames.search")}
          value={query}
        />
        {hits.map((account) => (
          <Button
            key={account.id}
            onClick={() => setSelectedId(account.id)}
            type="button"
            variant={selectedId === account.id ? "primary" : "secondary"}
          >
            {account.display_name}
          </Button>
        ))}
        <Input
          aria-label={t("settings.nicknames.nickname")}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t("settings.nicknames.nickname")}
          value={draft}
        />
        <Button type="submit">{t("settings.nicknames.add")}</Button>
      </form>
      <ListView
        onRetry={() => {
          void nicknames.refetch();
        }}
        status={queryListStatus(nicknames.isPending, nicknames.isError, rows.length === 0)}
      >
        <ul className="flex flex-col gap-[var(--control-gap)]">
          {rows.map((row) => (
            <li className="flex flex-col gap-[var(--space-2)]" key={row.account.id}>
              <p className={WEIGHT_EMPHASIS}>{row.account.display_name}</p>
              <Input
                aria-label={t("settings.nicknames.nickname")}
                defaultValue={row.nickname}
                onBlur={(event) => {
                  const next = event.target.value.trim();
                  if (next && next !== row.nickname) {
                    upsert.mutate({ accountId: row.account.id, nickname: next });
                  }
                }}
              />
              <Button
                onClick={() => destroy.mutate(row.account.id)}
                type="button"
                variant="danger"
              >
                {t("settings.nicknames.remove")}
              </Button>
            </li>
          ))}
        </ul>
      </ListView>
    </section>
  );
}

function ExportJobsManager(): ReactNode {
  const { t } = useTranslation();
  const jobs = useExportJobs();
  const create = useCreateExportJob();
  const download = useDownloadExportJob();
  const conversations = useConversations();
  const [format, setFormat] = useState<ExportFormat>("json");
  const [conversationId, setConversationId] = useState(EXPORT_ALL_CONVERSATIONS);
  const [includeMedia, setIncludeMedia] = useState(false);
  const rows = jobs.data?.export_jobs ?? [];
  const exportable = exportableConversations(conversations.data?.conversations ?? []);

  function onCreate(event: FormEvent): void {
    event.preventDefault();
    create.mutate({
      format,
      include_media: includeMedia,
      conversation_id:
        conversationId === EXPORT_ALL_CONVERSATIONS ? null : Number(conversationId),
    });
  }

  return (
    <section className="flex flex-col gap-[var(--control-gap)]">
      <h2 className={WEIGHT_EMPHASIS}>{t("settings.export.title")}</h2>
      <form className="flex flex-col gap-[var(--control-gap)]" onSubmit={onCreate}>
        <Select onValueChange={(value) => setFormat(value as ExportFormat)} value={format}>
          <SelectTrigger aria-label={t("settings.export.format_label")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EXPORT_FORMATS.map((value) => (
              <SelectItem key={value} value={value}>
                {t(`settings.export.format.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={setConversationId} value={conversationId}>
          <SelectTrigger aria-label={t("settings.export.conversation")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={EXPORT_ALL_CONVERSATIONS}>
              {t("settings.export.all_chats")}
            </SelectItem>
            {exportable.map((conversation) => (
              <SelectItem key={conversation.id} value={String(conversation.id)}>
                {conversationTitle(conversation, t("conversations.untitled"))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex min-h-[var(--control-height)] items-center gap-[var(--control-gap)]">
          <Checkbox
            aria-label={t("settings.export.include_media")}
            checked={includeMedia}
            onCheckedChange={(checked) => setIncludeMedia(checked === true)}
          />
          <span>{t("settings.export.include_media")}</span>
        </label>
        <Button type="submit">{t("settings.export.create")}</Button>
      </form>
      <ListView
        onRetry={() => {
          void jobs.refetch();
        }}
        status={queryListStatus(jobs.isPending, jobs.isError, rows.length === 0)}
      >
        <ul className="flex flex-col gap-[var(--control-gap)]">
          {rows.map((job) => (
            <li className="flex flex-col gap-[var(--space-2)]" key={job.id}>
              <p className={WEIGHT_EMPHASIS}>{t(`settings.export.format.${job.format}`)}</p>
              <p className="text-[var(--text-secondary)]">
                {t(`settings.export.status.${job.status}`)}
              </p>
              {job.status === "ready" ? (
                <Button onClick={() => download.mutate(job.id)} type="button">
                  {t("settings.export.download")}
                </Button>
              ) : null}
              {job.status === "failed" ? (
                <p className="text-[var(--status-danger)]">{t("settings.export.failed")}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </ListView>
    </section>
  );
}
