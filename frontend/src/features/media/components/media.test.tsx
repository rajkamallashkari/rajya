import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/app/providers";
import { AttachmentFailed } from "@/features/media/components/attachment-failed";
import { AttachmentPending } from "@/features/media/components/attachment-pending";
import { ProgressiveImage } from "@/features/media/components/progressive-image";
import { UploadPreview } from "@/features/media/components/upload-preview";
import { MediaLightbox } from "@/features/media/components/media-lightbox";
import { albumCellRadius, computeAlbumLayout } from "@/features/media/model/layout";
import {
  MEDIA_URL_STALE_MAX_MS,
  GIF_SEARCH_MIN_QUERY_LENGTH,
  aspectStyle,
  clampedAspect,
  extraAlbumCount,
  isImageAttachment,
  isVisualAttachment,
} from "@/features/media/model/constants";
import { getAttachmentDownload, listConversationMedia, listStickerPacks, searchGifs } from "@/features/media/api/http";
import { mediaKeys } from "@/features/media/api/keys";
import { setAccessSession } from "@/features/auth/model/access-session";
import { testSession } from "@/test/access-session";
import { displayFilename, fileExtension, fileKindKey, formatByteSize, truncateFilename } from "@/features/media/model/files";
import { nextLightboxZoom, wrapLightboxIndex } from "@/features/media/model/lightbox";
import { paintBlurhash, progressiveStage } from "@/features/media/model/progressive";
import { isPreviewableName, uploadProgressWidth } from "@/features/media/model/upload";
import { nextPlaybackRate, playbackRateLabel, seekFraction, voiceProgress } from "@/features/media/model/voice";
import { mediaUrlStaleTime, useGifSearch, useStickerPacks } from "@/features/media/api/queries";
import { resetVoicePlayer, useVoicePlayerStore } from "@/features/media/store/voice-player";
import { en } from "@/shared/lib/i18n/catalog";

const PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

describe("media models", () => {
  it("keeps explicit aspect ratios and album extras", () => {
    expect(aspectStyle(16, 9).aspectRatio).toBe("16 / 9");
    expect(aspectStyle(null, null).aspectRatio).toBe("4 / 3");
    expect(extraAlbumCount(4)).toBe(0);
    expect(extraAlbumCount(7)).toBe(4);
    expect(clampedAspect(1, 100)).toBe(0.5);
    expect(clampedAspect(100, 1)).toBe(2);
    expect(clampedAspect(0, 0)).toBeGreaterThan(0);
    expect(isImageAttachment({ kind: "image" })).toBe(true);
    expect(isVisualAttachment({ kind: "video" })).toBe(true);
    expect(albumCellRadius(["tl", "tr", "bl", "br"]).borderTopLeftRadius).toBe("var(--radius-lg)");
    expect(albumCellRadius([]).borderTopRightRadius).toBe("var(--radius-sm)");
    expect(computeAlbumLayout([{ width: 280, height: 140 }], 280).rows).toBe("140px");
    expect(computeAlbumLayout([{}, {}], 280).cellAreas).toEqual(["a", "b"]);
    expect(computeAlbumLayout([{}, {}, {}], 280).areas).toContain("a c");
    expect(computeAlbumLayout([{}, {}, {}, {}, {}], 280).cellAreas).toHaveLength(4);
    expect(fileExtension("readme")).toBe("");
    expect(fileKindKey("notes.pdf")).toBe("pdf");
    expect(fileKindKey("notes.docx")).toBe("word");
    expect(fileKindKey("sheet.xlsx")).toBe("sheet");
    expect(fileKindKey("deck.pptx")).toBe("slides");
    expect(fileKindKey("a.zip")).toBe("archive");
    expect(fileKindKey("app.ts")).toBe("code");
    expect(fileKindKey("x.bin")).toBe("file");
    expect(displayFilename("", "image/")).toBe("file.bin");
    expect(formatByteSize(12).unit).toBe("b");
    expect(formatByteSize(2048).unit).toBe("kb");
    expect(formatByteSize(2_000_000).unit).toBe("mb");
    expect(truncateFilename("short")).toBe("short");
    expect(truncateFilename("abcdefghijklmnopqrstuvwxyzabcdef")).toContain("…");
    expect(displayFilename(null, "image/png")).toBe("file.png");
    expect(displayFilename(null, "octet")).toBe("file.bin");
    expect(displayFilename("a.png", "image/png")).toBe("a.png");
    expect(nextLightboxZoom(1)).toBe(2);
    expect(nextLightboxZoom(3)).toBe(1);
    expect(wrapLightboxIndex(-1, 3)).toBe(2);
    expect(wrapLightboxIndex(0, 0)).toBe(0);
    expect(progressiveStage(false, false)).toBe("placeholder");
    expect(progressiveStage(true, false)).toBe("thumb");
    expect(progressiveStage(true, true)).toBe("full");
    expect(nextPlaybackRate(1)).toBe(1.5);
    expect(nextPlaybackRate(2)).toBe(1);
    expect(nextPlaybackRate(9)).toBe(1);
    expect(playbackRateLabel(1.5)).toBe("1.5×");
    expect(voiceProgress(5, 10)).toBe(0.5);
    expect(voiceProgress(1, 0)).toBe(0);
    expect(seekFraction(15, 10, 10)).toBe(0.5);
    expect(seekFraction(0, 0, 0)).toBe(0);
    expect(uploadProgressWidth(150)).toBe("100%");
    expect(uploadProgressWidth(-4)).toBe("0%");
    expect(isPreviewableName("a.png")).toBe(true);
    expect(isPreviewableName("a.bin", "image/png")).toBe(true);
    expect(isPreviewableName("a.bin")).toBe(false);
    expect(isPreviewableName("x", "video/mp4")).toBe(true);
    expect(mediaKeys.gallery(1, "images")[1]).toBe("gallery");
    expect(mediaKeys.gifs("hi")[1]).toBe("gifs");
    expect(mediaKeys.stickerPacks()[1]).toBe("sticker_packs");
    expect(GIF_SEARCH_MIN_QUERY_LENGTH).toBeGreaterThan(0);
    expect(mediaUrlStaleTime("not-a-date")).toBe(0);
    expect(mediaUrlStaleTime(new Date(Date.now() + 60_000).toISOString(), Date.now())).toBeGreaterThan(0);
    expect(mediaUrlStaleTime("2099-01-01T00:00:00.000Z", Date.now())).toBe(MEDIA_URL_STALE_MAX_MS);
    const canvas = document.createElement("canvas");
    expect(paintBlurhash(canvas, "not-a-hash")).toBe(false);
    const ctx = {
      createImageData: (width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4) }),
      putImageData: vi.fn(),
    };
    vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    expect(paintBlurhash(canvas, "LKO2?U%2Tw=w]~RBVZRi};RPxuwH")).toBe(true);
    vi.spyOn(canvas, "getContext").mockReturnValue(null);
    expect(paintBlurhash(canvas, "LKO2?U%2Tw=w]~RBVZRi};RPxuwH")).toBe(false);
  });
});

describe("progressive rendering", () => {
  it("advances blurhash to thumbnail to full without layout shift", () => {
    const { container } = render(
      <ProgressiveImage alt={en.media.photo} blurhash="LKO2?U%2Tw=w]~RBVZRi};RPxuwH" fullSrc={PIXEL} height={9} thumbSrc={PIXEL} width={16} />,
    );
    const box = container.querySelector("[data-progressive-stage]") as HTMLElement;
    expect(box.style.aspectRatio).toBe("16 / 9");
    expect(box).toHaveAttribute("data-progressive-stage", "placeholder");
    const images = container.querySelectorAll("img");
    fireEvent.load(images[0]!);
    expect(box).toHaveAttribute("data-progressive-stage", "thumb");
    fireEvent.load(images[1]!);
    expect(box).toHaveAttribute("data-progressive-stage", "full");
    const extra = render(
      <ProgressiveImage
        alt={en.media.photo}
        fullSrc={PIXEL}
        onClick={() => undefined}
        thumbSrc={PIXEL}
      />,
    );
    expect(extra.container.querySelector("[data-blurhash]")).toBeNull();
    fireEvent.click(extra.container.querySelectorAll("img")[1]!);
  });
});

describe("failed and pending media", () => {
  it("renders a retryable failed state", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <AppProviders>
        <AttachmentFailed
          attachment={{
            byte_size: 1,
            content_type: "image/png",
            id: 1,
            kind: "image",
            processing_error: en.media.failed,
            processing_status: "failed",
          }}
          onRetry={onRetry}
        />
        <AttachmentPending
          attachment={{ byte_size: 1, content_type: "image/png", id: 2, kind: "image", processing_status: "pending" }}
        />
      </AppProviders>,
    );
    expect(document.querySelector("[data-attachment-failed]")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: en.media.retry }));
    expect(onRetry).toHaveBeenCalled();
    expect(document.querySelector("[data-attachment-pending]")).not.toBeNull();
    render(
      <AppProviders>
        <AttachmentFailed
          attachment={{
            byte_size: 1,
            content_type: "image/png",
            id: 3,
            kind: "image",
            processing_status: "failed",
          }}
        />
      </AppProviders>,
    );
    expect(screen.queryAllByRole("button", { name: en.media.retry })).toHaveLength(1);
  });
});

describe("upload preview", () => {
  it("cancels tiles", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <AppProviders>
        <UploadPreview
          onCancel={onCancel}
          uploads={[
            { id: "a", name: "a.png", previewUrl: PIXEL, progress: 20, status: "uploading" },
            { id: "b", name: "b.pdf", progress: 0, status: "failed" },
            { id: "c", name: "c.png", progress: 100, status: "done" },
            { id: "d", name: "d.bin", progress: 10, status: "pending" },
          ]}
        />
      </AppProviders>,
    );
    await user.click(screen.getAllByRole("button")[0]!);
    expect(onCancel).toHaveBeenCalledWith("a");
    render(<AppProviders><UploadPreview onCancel={onCancel} uploads={[]} /></AppProviders>);
  });
});

describe("lightbox wrap", () => {
  it("returns null without visual attachments", () => {
    const { container } = render(
      <AppProviders>
        <MediaLightbox
          attachments={[{ byte_size: 1, content_type: "application/pdf", id: 1, kind: "file", processing_status: "ready" }]}
          onClose={() => undefined}
          open
        />
      </AppProviders>,
    );
    expect(container.querySelector("[data-media-lightbox]")).toBeNull();
  });

  it("pages, zooms, and closes image and video slides", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    setAccessSession(testSession());
    render(
      <AppProviders>
        <MediaLightbox
          attachments={[
            {
              byte_size: 1,
              content_type: "image/png",
              id: 13,
              kind: "image",
              processing_status: "ready",
            },
            {
              byte_size: 1,
              content_type: "video/mp4",
              id: 12,
              kind: "video",
              processing_status: "ready",
            },
            {
              byte_size: 1,
              content_type: "image/png",
              filename: "a.png",
              id: 11,
              kind: "image",
              processing_status: "ready",
            },
          ]}
          onClose={onClose}
          open
        />
      </AppProviders>,
    );
    await waitFor(() => {
      expect(document.querySelector("[data-media-lightbox] img, [data-media-lightbox] video")).not.toBeNull();
    });
    fireEvent.doubleClick(document.querySelector("[data-media-lightbox]") as HTMLElement);
    await user.click(screen.getByRole("button", { name: en.media.next }));
    await waitFor(() => {
      expect(document.querySelector("[data-media-lightbox] video")).not.toBeNull();
    });
    await user.click(screen.getByRole("button", { name: en.media.previous }));
    await user.click(screen.getByRole("button", { name: en.ui.close }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("voice player store", () => {
  it("plays, seeks, cycles speed, and pauses", async () => {
    const play = vi.fn().mockResolvedValue(undefined);
    const pause = vi.fn();
    const listeners: Record<string, () => void> = {};
    const created: InstanceType<typeof FakeAudio>[] = [];
    class FakeAudio {
      currentTime = 0;
      duration = 4;
      playbackRate = 1;
      src = "";
      constructor() {
        created.push(this);
      }
      addEventListener(type: string, handler: () => void) {
        listeners[type] = handler;
        if (type === "loadedmetadata") {
          handler();
        }
      }
      play = play;
      pause = pause;
    }
    vi.stubGlobal("Audio", FakeAudio);
    resetVoicePlayer();
    useVoicePlayerStore.getState().cycleSpeed();
    expect(useVoicePlayerStore.getState().playbackRate).toBe(1.5);
    useVoicePlayerStore.getState().play("m1", "https://example.com/a.ogg");
    await Promise.resolve();
    expect(useVoicePlayerStore.getState().isPlaying).toBe(true);
    listeners.timeupdate?.();
    const element = created[0];
    if (element) {
      element.duration = 0;
    }
    listeners.loadedmetadata?.();
    listeners.timeupdate?.();
    listeners.ended?.();
    expect(useVoicePlayerStore.getState().isPlaying).toBe(false);
    useVoicePlayerStore.getState().seek(2);
    useVoicePlayerStore.getState().cycleSpeed();
    expect(useVoicePlayerStore.getState().playbackRate).toBe(2);
    useVoicePlayerStore.getState().pause();
    expect(useVoicePlayerStore.getState().isPlaying).toBe(false);
    useVoicePlayerStore.getState().play("m2", "https://example.com/b.ogg");
    useVoicePlayerStore.getState().play("m2", "https://example.com/b.ogg");
    vi.stubGlobal(
      "Audio",
      class {
        play = vi.fn().mockRejectedValue(new Error("fail"));
        pause = vi.fn();
        addEventListener() {}
        currentTime = 0;
        duration = 0;
        playbackRate = 1;
        src = "";
      },
    );
    resetVoicePlayer();
    useVoicePlayerStore.getState().seek(1);
    useVoicePlayerStore.getState().play("m3", "x");
    await Promise.resolve();
    expect(useVoicePlayerStore.getState().isPlaying).toBe(false);
    useVoicePlayerStore.getState().seek(1);
    resetVoicePlayer();
    vi.unstubAllGlobals();
  });
});

describe("media http", () => {
  it("unwraps download and gallery pages", async () => {
    setAccessSession(testSession());
    await expect(getAttachmentDownload(1)).resolves.toMatchObject({ url: "https://media.test/file" });
    await expect(listConversationMedia(1, "images", 1)).resolves.toMatchObject({
      meta: { has_more: true },
    });
    await expect(listStickerPacks()).resolves.toMatchObject({ sticker_packs: [{ id: 1 }] });
    await expect(searchGifs("party")).resolves.toMatchObject({ gifs: [{ id: "tenor-1" }] });
    await expect(searchGifs("fail")).rejects.toThrow();
  });
});

function PickerQueryHarness() {
  const packs = useStickerPacks();
  const gifs = useGifSearch("party");
  const short = useGifSearch("p");
  return (
    <div>
      <p data-packs={packs.isSuccess ? "yes" : "no"}>{packs.data?.sticker_packs.length ?? 0}</p>
      <p data-gifs={gifs.isSuccess ? "yes" : "no"}>{gifs.data?.gifs.length ?? 0}</p>
      <p data-short={short.fetchStatus} />
    </div>
  );
}

describe("sticker and gif queries", () => {
  it("loads packs and searches GIFs only after the minimum query length", async () => {
    setAccessSession(testSession());
    render(
      <AppProviders>
        <PickerQueryHarness />
      </AppProviders>,
    );
    await waitFor(() => {
      expect(document.querySelector("[data-packs]")?.textContent).toBe("1");
      expect(document.querySelector("[data-gifs]")?.textContent).toBe("1");
    });
    expect(document.querySelector("[data-short]")?.getAttribute("data-short")).toBe("idle");
  });
});
