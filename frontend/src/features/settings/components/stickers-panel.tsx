import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { getAccessSession } from "@/features/auth/model/access-session";
import {
  useAddStickerToPack,
  useCreateStickerPack,
  useDestroyStickerPack,
  useRemoveStickerFromPack,
  useStickerPacks,
} from "@/features/media/api/queries";
import { presignAndUpload } from "@/features/media/model/direct-upload";
import {
  STICKER_PACK_KINDS,
  type StickerPackKind,
} from "@/features/settings/model/constants";
import { isOwnedStickerPack, queryListStatus } from "@/features/settings/model/map-sessions";
import {
  Badge,
  Button,
  Input,
  ListView,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export function StickersPanel() {
  const { t } = useTranslation();
  const packs = useStickerPacks();
  const create = useCreateStickerPack();
  const destroy = useDestroyStickerPack();
  const addSticker = useAddStickerToPack();
  const removeSticker = useRemoveStickerFromPack();
  const accountId = getAccessSession()?.accountId;
  const [name, setName] = useState("");
  const [kind, setKind] = useState<StickerPackKind>("sticker");
  const [shortcodes, setShortcodes] = useState<Record<number, string>>({});
  const rows = packs.data?.sticker_packs ?? [];

  function onCreate(event: FormEvent): void {
    event.preventDefault();
    const next = name.trim();
    if (!next) {
      return;
    }
    create.mutate(
      { name: next, kind },
      {
        onSuccess: () => setName(""),
      },
    );
  }

  async function onAddFile(packId: number, event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = "";
    const shortcode = (shortcodes[packId] ?? "").trim();
    if (!file || !shortcode) {
      return;
    }
    const signedId = await presignAndUpload(file);
    addSticker.mutate({ packId, signedId, shortcode });
  }

  return (
    <div className="flex flex-col gap-[var(--control-gap)]" data-stickers-panel="">
      <form className="flex flex-col gap-[var(--control-gap)]" onSubmit={onCreate}>
        <Input
          aria-label={t("settings.sticker_packs.name")}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("settings.sticker_packs.name")}
          value={name}
        />
        <Select onValueChange={(value) => setKind(value as StickerPackKind)} value={kind}>
          <SelectTrigger aria-label={t("settings.sticker_packs.kind")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STICKER_PACK_KINDS.map((value) => (
              <SelectItem key={value} value={value}>
                {t(`settings.sticker_packs.kind_${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit">{t("settings.sticker_packs.create")}</Button>
      </form>
      <ListView
        onRetry={() => {
          void packs.refetch();
        }}
        status={queryListStatus(packs.isPending, packs.isError, rows.length === 0)}
      >
        <ul className="flex flex-col gap-[var(--space-4)]">
          {rows.map((pack) => {
            const owned = isOwnedStickerPack(pack, accountId);
            return (
              <li className="flex flex-col gap-[var(--control-gap)]" data-pack-id={pack.id} key={pack.id}>
                <div className="flex flex-wrap items-center gap-[var(--space-2)]">
                  <p className={WEIGHT_EMPHASIS}>{pack.name}</p>
                  <Badge>
                    {owned
                      ? t("settings.sticker_packs.owned")
                      : t("settings.sticker_packs.published")}
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-[var(--space-2)]">
                  {pack.stickers.map((sticker) => (
                    <div className="flex flex-col items-center gap-[var(--space-1)]" key={sticker.id}>
                      {sticker.url ? (
                        <img
                          alt={sticker.shortcode}
                          className="size-[var(--space-8)]"
                          src={sticker.url}
                        />
                      ) : (
                        <span>{sticker.shortcode}</span>
                      )}
                      {owned ? (
                        <Button
                          onClick={() => removeSticker.mutate({ packId: pack.id, id: sticker.id })}
                          size="sm"
                          type="button"
                          variant="danger"
                        >
                          {t("settings.sticker_packs.remove_sticker")}
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
                {owned ? (
                  <OwnedPackControls
                    onAddFile={(event) => {
                      void onAddFile(pack.id, event);
                    }}
                    onDelete={() => destroy.mutate(pack.id)}
                    onShortcode={(value) =>
                      setShortcodes((current) => ({ ...current, [pack.id]: value }))
                    }
                    shortcode={shortcodes[pack.id] ?? ""}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      </ListView>
    </div>
  );
}

function OwnedPackControls({
  onAddFile,
  onDelete,
  onShortcode,
  shortcode,
}: {
  onAddFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onDelete: () => void;
  onShortcode: (value: string) => void;
  shortcode: string;
}): ReactNode {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-[var(--control-gap)]">
      <Input
        aria-label={t("settings.sticker_packs.shortcode")}
        onChange={(event) => onShortcode(event.target.value)}
        placeholder={t("settings.sticker_packs.shortcode")}
        value={shortcode}
      />
      <Input
        accept="image/*"
        aria-label={t("settings.sticker_packs.add")}
        onChange={onAddFile}
        type="file"
      />
      <Button onClick={onDelete} type="button" variant="danger">
        {t("settings.sticker_packs.delete")}
      </Button>
    </div>
  );
}
