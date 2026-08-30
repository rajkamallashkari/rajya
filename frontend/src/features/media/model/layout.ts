import {
  ALBUM_CELL_HEIGHT_PX,
  ALBUM_SINGLE_MAX_HEIGHT_PX,
  clampedAspect,
  type Attachment,
  type Corner,
} from "@/features/media/model/constants";

export interface AlbumLayout {
  areas: string;
  columns: string;
  rows: string;
  cellAreas: string[];
  cellCorners: Corner[][];
}

export function computeAlbumLayout(
  attachments: Pick<Attachment, "width" | "height">[],
  containerWidth: number,
  cellHeight: number = ALBUM_CELL_HEIGHT_PX,
): AlbumLayout {
  switch (attachments.length) {
    case 1: {
      const height = Math.min(
        Math.round(containerWidth / clampedAspect(attachments[0]?.width, attachments[0]?.height)),
        ALBUM_SINGLE_MAX_HEIGHT_PX,
      );
      return {
        areas: '"a"',
        columns: "1fr",
        rows: `${String(height)}px`,
        cellAreas: ["a"],
        cellCorners: [["tl", "tr", "bl", "br"]],
      };
    }
    case 2:
      return {
        areas: '"a b"',
        columns: "1fr 1fr",
        rows: `${String(cellHeight)}px`,
        cellAreas: ["a", "b"],
        cellCorners: [
          ["tl", "bl"],
          ["tr", "br"],
        ],
      };
    case 3:
      return {
        areas: '"a b" "a c"',
        columns: "1fr 1fr",
        rows: `${String(cellHeight)}px ${String(cellHeight)}px`,
        cellAreas: ["a", "b", "c"],
        cellCorners: [["tl", "bl"], ["tr"], ["br"]],
      };
    default:
      return {
        areas: '"a b" "c d"',
        columns: "1fr 1fr",
        rows: `${String(cellHeight)}px ${String(cellHeight)}px`,
        cellAreas: ["a", "b", "c", "d"],
        cellCorners: [["tl"], ["tr"], ["bl"], ["br"]],
      };
  }
}

export function albumCellRadius(corners: Corner[]): {
  borderTopLeftRadius: string;
  borderTopRightRadius: string;
  borderBottomLeftRadius: string;
  borderBottomRightRadius: string;
} {
  const outer = "var(--radius-lg)";
  const inner = "var(--radius-sm)";
  return {
    borderTopLeftRadius: corners.includes("tl") ? outer : inner,
    borderTopRightRadius: corners.includes("tr") ? outer : inner,
    borderBottomLeftRadius: corners.includes("bl") ? outer : inner,
    borderBottomRightRadius: corners.includes("br") ? outer : inner,
  };
}
