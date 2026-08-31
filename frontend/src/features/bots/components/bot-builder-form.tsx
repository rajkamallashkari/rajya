import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCreateBotRequest } from "@/features/bots/api/queries";
import registry from "@/shared/lib/config/settings-registry.json";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";

const PROMPT_MINIMUM_LENGTH = registry.ai_prompt_minimum_length.default as number;

export function BotBuilderForm() {
  const { t } = useTranslation();
  const create = useCreateBotRequest();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [persona, setPersona] = useState("");
  const tooShort = persona.trim().length > 0 && persona.trim().length < PROMPT_MINIMUM_LENGTH;
  const invalid =
    name.trim() === "" ||
    username.trim() === "" ||
    bio.trim() === "" ||
    persona.trim().length < PROMPT_MINIMUM_LENGTH;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (invalid) {
      return;
    }
    create.mutate(
      {
        kind: "create",
        payload: { bio: bio.trim(), name: name.trim(), persona_prompt: persona.trim(), username: username.trim() },
      },
      {
        onSuccess: () => {
          setName("");
          setUsername("");
          setBio("");
          setPersona("");
        },
      },
    );
  };

  return (
    <form className="flex flex-col gap-[var(--space-3)]" data-bot-builder="" onSubmit={onSubmit}>
      <p className="[font-weight:var(--font-weight-emphasis)]">{t("bots.builder")}</p>
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
      {create.isSuccess ? (
        <p className="text-[length:var(--text-sm)] text-[var(--status-success)]">{t("bots.proposed")}</p>
      ) : null}
      <Button disabled={invalid || create.isPending} type="submit">
        {t("bots.builder_submit")}
      </Button>
    </form>
  );
}
