import { useTranslation } from "react-i18next";
import { RemoteProgressiveImage } from "@/features/media/components/remote-progressive-image";
import { albumCellRadius, computeAlbumLayout } from "@/features/media/model/layout";
import {
  ALBUM_CELL_HEIGHT_PX,
  ALBUM_GAP_PX,
  ALBUM_MAX_WIDTH_PX,
  ALBUM_VISIBLE_MAX,
  extraAlbumCount,
  isImageAttachment,
  type Attachment,
} from "@/features/media/model/constants";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui";

export function AlbumGrid({
  attachments,
  cellHeight = ALBUM_CELL_HEIGHT_PX,
  maxWidth = ALBUM_MAX_WIDTH_PX,
  onPhotoClick,
  totalImageCount,
}: {
  attachments: Attachment[];
  cellHeight?: number;
  maxWidth?: number | null;
  onPhotoClick?: (index: number) => void;
  totalImageCount?: number;
}) {
  const { t } = useTranslation();
  const images = attachments.filter(isImageAttachment);
  if (images.length === 0) {
    return null;
  }
  const total = totalImageCount ?? images.length;
  const visible = images.slice(0, Math.min(images.length, ALBUM_VISIBLE_MAX));
  const extra = extraAlbumCount(total);
  const layoutWidth = maxWidth ?? ALBUM_MAX_WIDTH_PX;
  const layout = computeAlbumLayout(visible, layoutWidth, cellHeight);

  return (
    <div
      className="overflow-hidden rounded-[var(--radius-lg)]"
      data-album-grid=""
      style={{
        display: "grid",
        gap: `${String(ALBUM_GAP_PX)}px`,
        gridTemplateAreas: layout.areas,
        gridTemplateColumns: layout.columns,
        gridTemplateRows: layout.rows,
        width: "100%",
        ...(maxWidth != null ? { maxWidth: `${String(maxWidth)}px` } : {}),
      }}
    >
      {visible.map((image, index) => {
        const overlay = index === visible.length - 1 && extra > 0 ? extra : 0;
        return (
          <Button
            aria-label={image.filename ?? t("media.photo")}
            className="relative min-h-[var(--touch-target-min)] min-w-0 overflow-hidden p-0"
            data-album-cell=""
            key={image.id}
            onClick={() => onPhotoClick?.(index)}
            style={{
              gridArea: layout.cellAreas[index],
              ...albumCellRadius(layout.cellCorners[index]!),
            }}
            type="button"
            variant="ghost"
          >
            <RemoteProgressiveImage
              alt={image.filename ?? t("media.photo")}
              attachment={image}
              wantFull={false}
            />
            {overlay > 0 ? (
              <span
                className={cn(
                  "absolute inset-0 flex items-center justify-center bg-[var(--overlay-scrim)] text-[length:var(--text-lg)] text-[var(--text-inverse)]",
                )}
                data-album-extra=""
              >
                {t("media.more", { count: overlay })}
              </span>
            ) : null}
          </Button>
        );
      })}
    </div>
  );
}
