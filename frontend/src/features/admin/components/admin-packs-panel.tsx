import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  useAddAdminSticker,
  useAdminStickerPacks,
  useCreateAdminStickerPack,
  useDestroyAdminStickerPack,
  useRemoveAdminSticker,
  useReorderAdminStickerPacks,
  useUpdateAdminStickerPack,
} from "@/features/admin/api/queries";
import { queryListStatus } from "@/features/admin/model/display";
import { presignAndUpload } from "@/features/media/model/direct-upload";
import { STICKER_PACK_KINDS, type StickerPackKind } from "@/features/settings/model/constants";
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

export function AdminPacksPanel(): ReactNode {
  const { t } = useTranslation();
  const packs = useAdminStickerPacks();
  const create = useCreateAdminStickerPack();
  const update = useUpdateAdminStickerPack();
  const destroy = useDestroyAdminStickerPack();
  const reorder = useReorderAdminStickerPacks();
  const addSticker = useAddAdminSticker();
  const removeSticker = useRemoveAdminSticker();
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
    create.mutate({ kind, name: next }, { onSuccess: () => setName("") });
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

  function move(index: number, delta: number): void {
    const next = index + delta;
    if (next < 0 || next >= rows.length) {
      return;
    }
    const ids = rows.map((row) => row.id);
    const swap = ids[index]!;
    ids[index] = ids[next]!;
    ids[next] = swap;
    reorder.mutate(ids);
  }

  return (
    <div className="flex flex-col gap-[var(--control-gap)]" data-admin-packs="">
      <h1 className={WEIGHT_EMPHASIS}>{t("admin.packs")}</h1>
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
        onRetry={() => void packs.refetch()}
        status={queryListStatus(packs.isPending, packs.isError, rows.length === 0)}
      >
        <ul className="flex flex-col gap-[var(--space-4)]">
          {rows.map((pack, index) => (
            <li className="flex flex-col gap-[var(--control-gap)]" key={pack.id}>
              <p className={WEIGHT_EMPHASIS}>{pack.name}</p>
              <Badge variant={pack.published_at ? "success" : "muted"}>
                {pack.published_at ? t("settings.sticker_packs.published") : t("admin.unpublish")}
              </Badge>
              <div className="flex flex-wrap gap-[var(--control-gap)]">
                <Button onClick={() => move(index, -1)} type="button" variant="ghost">
                  {t("admin.move_up")}
                </Button>
                <Button onClick={() => move(index, 1)} type="button" variant="ghost">
                  {t("admin.move_down")}
                </Button>
                <Button
                  onClick={() =>
                    update.mutate({ body: { published: pack.published_at == null }, id: pack.id })
                  }
                  type="button"
                  variant="secondary"
                >
                  {pack.published_at ? t("admin.unpublish") : t("admin.publish")}
                </Button>
                <Button onClick={() => destroy.mutate(pack.id)} type="button" variant="secondary">
                  {t("settings.sticker_packs.delete")}
                </Button>
              </div>
              {pack.stickers.map((sticker) => (
                <div className="flex items-center gap-[var(--control-gap)]" key={sticker.id}>
                  <span>{sticker.shortcode}</span>
                  <Button
                    onClick={() => removeSticker.mutate({ id: sticker.id, packId: pack.id })}
                    type="button"
                    variant="ghost"
                  >
                    {t("settings.sticker_packs.remove_sticker")}
                  </Button>
                </div>
              ))}
              <Input
                aria-label={t("settings.sticker_packs.shortcode")}
                onChange={(event) =>
                  setShortcodes((current) => ({ ...current, [pack.id]: event.target.value }))
                }
                placeholder={t("settings.sticker_packs.shortcode")}
                value={shortcodes[pack.id] ?? ""}
              />
              <input
                aria-label={t("settings.sticker_packs.add")}
                onChange={(event) => void onAddFile(pack.id, event)}
                type="file"
              />
            </li>
          ))}
        </ul>
      </ListView>
    </div>
  );
}
