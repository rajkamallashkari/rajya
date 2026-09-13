import { Camera } from "lucide-react";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Bot, BotRequest } from "@/features/bots/api/http";
import { useCreateBotRequest, useUpdateBotRequest } from "@/features/bots/api/queries";
import { AVATAR_ALLOWED_TYPES, AVATAR_MAX_BYTES } from "@/features/auth/model/limits";
import { presignAndUpload } from "@/features/media/model/direct-upload";
import registry from "@/shared/lib/config/settings-registry.json";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { ICON_CLASS } from "@/shared/ui/metrics";

const PROMPT_MINIMUM_LENGTH = registry.ai_prompt_minimum_length.default as number;

type BuilderProps = {
  bot?: Bot;
  draft?: BotRequest;
  onCancel?: () => void;
  onSaved?: () => void;
  request?: BotRequest;
};

export function BotBuilderForm({ bot, draft, onCancel, onSaved, request }: BuilderProps) {
  const { t } = useTranslation();
  const create = useCreateBotRequest();
  const update = useUpdateBotRequest();
  const initial = request?.payload ?? draft?.payload;
  const [name, setName] = useState(initial?.name ?? bot?.account.display_name ?? "");
  const [username, setUsername] = useState(initial?.username ?? bot?.account.username ?? "");
  const [bio, setBio] = useState(initial?.bio ?? bot?.account.bio ?? "");
  const [persona, setPersona] = useState(initial?.persona_prompt ?? bot?.persona_prompt ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentAvatar = request?.avatar_url ?? bot?.account.avatar_url ?? null;
  const tooShort = persona.trim().length > 0 && persona.trim().length < PROMPT_MINIMUM_LENGTH;
  const invalid =
    name.trim() === "" ||
    username.trim() === "" ||
    bio.trim() === "" ||
    persona.trim().length < PROMPT_MINIMUM_LENGTH;

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const preview = URL.createObjectURL(avatarFile);
    setAvatarPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [avatarFile]);

  const onAvatarChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
      setErrorKey("bots.avatar_file_invalid");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setErrorKey("bots.avatar_size_invalid");
      return;
    }
    setErrorKey(null);
    setRemoveAvatar(false);
    setAvatarFile(file);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (invalid) return;
    setErrorKey(null);
    try {
      const avatar = avatarFile
        ? await presignAndUpload(avatarFile)
        : removeAvatar
          ? null
          : undefined;
      const payload = {
        bio: bio.trim(),
        name: name.trim(),
        persona_prompt: persona.trim(),
        username: username.trim(),
      };
      if (request) {
        await update.mutateAsync({ body: { avatar, payload }, id: request.id });
      } else {
        await create.mutateAsync({
          avatar,
          kind: bot ? "edit" : "create",
          payload,
          target_bot_id: bot?.id,
        });
        if (!bot) {
          setName("");
          setUsername("");
          setBio("");
          setPersona("");
        }
      }
      setAvatarFile(null);
      onSaved?.();
    } catch {
      setErrorKey(avatarFile ? "bots.avatar_upload_failed" : "bots.save_failed");
    }
  };

  return (
    <form
      className="flex flex-col gap-[var(--space-3)]"
      data-bot-builder=""
      onSubmit={(event) => void onSubmit(event)}
    >
      <p className="[font-weight:var(--font-weight-emphasis)]">
        {t(request ? "bots.edit_request" : bot ? "bots.edit" : "bots.builder")}
      </p>
      <div className="flex flex-col items-center gap-[var(--space-2)]">
        <Button
          aria-label={t("bots.avatar_change")}
          className="relative h-auto rounded-[var(--radius-full)] p-0"
          onClick={() => fileInputRef.current?.click()}
          type="button"
          variant="ghost"
        >
          <Avatar
            className="size-[var(--space-12)]"
            name={name || t("bots.builder")}
            src={avatarPreview ?? (removeAvatar ? null : currentAvatar)}
          />
          <Camera aria-hidden="true" className={ICON_CLASS} />
        </Button>
        <input
          accept={AVATAR_ALLOWED_TYPES.join(",")}
          className="hidden"
          onChange={onAvatarChange}
          ref={fileInputRef}
          type="file"
        />
        {avatarFile || (!removeAvatar && currentAvatar) ? (
          <Button
            onClick={() => {
              setAvatarFile(null);
              setRemoveAvatar(true);
            }}
            type="button"
            variant="ghost"
          >
            {t("bots.avatar_remove")}
          </Button>
        ) : null}
      </div>
      <Input
        aria-label={t("bots.name")}
        onChange={(event) => setName(event.target.value)}
        placeholder={t("bots.name")}
        value={name}
      />
      <Input
        aria-label={t("bots.username")}
        onChange={(event) => setUsername(event.target.value)}
        placeholder={t("bots.username")}
        value={username}
      />
      <Input
        aria-label={t("bots.bio")}
        onChange={(event) => setBio(event.target.value)}
        placeholder={t("bots.bio")}
        value={bio}
      />
      <Textarea
        aria-label={t("bots.persona_prompt")}
        onChange={(event) => setPersona(event.target.value)}
        placeholder={t("bots.persona_prompt")}
        rows={4}
        value={persona}
      />
      {tooShort ? (
        <p className="text-[length:var(--text-sm)] text-[var(--status-danger)]">
          {t("bots.prompt_too_short", { count: PROMPT_MINIMUM_LENGTH })}
        </p>
      ) : null}
      {errorKey ? (
        <p aria-live="polite" className="text-[length:var(--text-sm)] text-[var(--status-danger)]">
          {t(errorKey)}
        </p>
      ) : null}
      {create.isSuccess || update.isSuccess ? (
        <p className="text-[length:var(--text-sm)] text-[var(--status-success)]">
          {t("bots.proposed")}
        </p>
      ) : null}
      <div className="flex gap-[var(--control-gap)]">
        {onCancel ? (
          <Button onClick={onCancel} type="button" variant="secondary">
            {t("bots.cancel")}
          </Button>
        ) : null}
        <Button disabled={invalid || create.isPending || update.isPending} type="submit">
          {t(request ? "bots.update_request" : "bots.builder_submit")}
        </Button>
      </div>
    </form>
  );
}
