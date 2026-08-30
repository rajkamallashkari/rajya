import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/messages/model/highlight", () => ({
  highlightCode: vi.fn().mockResolvedValue(null),
}));
import { AppProviders } from "@/app/providers";
import { AlbumGrid } from "@/features/media/components/album-grid";
import { AttachmentBody } from "@/features/media/components/attachment-body";
import { DocumentBubble } from "@/features/media/components/document-bubble";
import { MediaGalleryPanel } from "@/features/media/components/media-gallery-panel";
import { VideoBubble } from "@/features/media/components/video-bubble";
import { RemoteProgressiveImage } from "@/features/media/components/remote-progressive-image";
import { VoiceNote } from "@/features/media/components/voice-note";
import { MessageBubble } from "@/features/messages/components/message-bubble";
import type { Attachment } from "@/features/media/model/constants";
import { en } from "@/shared/lib/i18n/catalog";
import { setAccessSession } from "@/features/auth/model/access-session";
import { testSession } from "@/test/access-session";
import { resetVoicePlayer } from "@/features/media/store/voice-player";

const readyImage = (id: number): Attachment => ({
  byte_size: 12,
  content_type: "image/png",
  filename: `p${String(id)}.png`,
  height: 9,
  id,
  kind: "image",
  processing_status: "ready",
  width: 16,
});

describe("album grid and attachment body", () => {
  it("overlays extra count and opens a lightbox", async () => {
    const user = userEvent.setup();
    setAccessSession(testSession());
    const onPhotoClick = vi.fn();
    render(
      <AppProviders>
        <AlbumGrid
          attachments={[readyImage(1), readyImage(2), readyImage(3), readyImage(4), readyImage(5)]}
          onPhotoClick={onPhotoClick}
          totalImageCount={5}
        />
      </AppProviders>,
    );
    expect(document.querySelector("[data-album-extra]")).not.toBeNull();
    await user.click(screen.getAllByRole("button")[0]!);
    expect(onPhotoClick).toHaveBeenCalledWith(0);
    const { container } = render(
      <AppProviders>
        <AlbumGrid
          attachments={[{ ...readyImage(9), filename: undefined }]}
          maxWidth={null}
        />
        <AlbumGrid attachments={[]} maxWidth={null} />
        <AttachmentBody attachments={[]} messageId="0" />
        <AttachmentBody
          attachments={[
            {
              byte_size: 1,
              content_type: "application/pdf",
              filename: "solo.pdf",
              id: 99,
              kind: "file",
              processing_status: "ready",
            },
          ]}
          messageId="99"
        />
      </AppProviders>,
    );
    expect(container.querySelector("[data-album-grid]")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: en.media.photo }));
    expect(container.querySelector("[data-document-bubble]")).not.toBeNull();
  });

  it("renders failed, pending, video, voice, and file attachments", async () => {
    const user = userEvent.setup();
    setAccessSession(testSession());
    render(
      <AppProviders>
        <MessageBubble
          attachments={[readyImage(8)]}
          body=""
          id="8"
          side="sent"
        />
        <AttachmentBody
          attachments={[
            { ...readyImage(1), processing_status: "failed", processing_error: en.media.failed },
            { ...readyImage(2), processing_status: "pending" },
            readyImage(6),
            readyImage(7),
            {
              byte_size: 20,
              content_type: "video/mp4",
              duration_ms: 1500,
              id: 3,
              kind: "video",
              processing_status: "ready",
              width: 16,
              height: 9,
            },
            {
              byte_size: 8,
              content_type: "audio/ogg",
              duration_ms: 2000,
              id: 4,
              kind: "voice",
              processing_status: "ready",
              waveform: [0.2, 0.8],
            },
            {
              byte_size: 2048,
              content_type: "application/pdf",
              filename: "notes.pdf",
              id: 5,
              kind: "file",
              processing_status: "ready",
            },
          ]}
          messageId="10"
        />
      </AppProviders>,
    );
    expect(document.querySelector("[data-attachment-failed]")).not.toBeNull();
    expect(document.querySelector("[data-attachment-pending]")).not.toBeNull();
    expect(document.querySelector("[data-video-bubble]")).not.toBeNull();
    expect(document.querySelector("[data-voice-note]")).not.toBeNull();
    expect(document.querySelector("[data-document-bubble]")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "p6.png" }));
    expect(document.querySelector("[data-media-lightbox]")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: en.ui.close }));
    await user.click(screen.getByRole("button", { name: en.media.retry }));
    await user.click(screen.getByRole("button", { name: en.media.play_video }));
    expect(document.querySelector("[data-media-lightbox]")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: en.ui.close }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: en.media.download })).not.toBeDisabled();
    });
    const play = vi.fn().mockResolvedValue(undefined);
    class FakeAudio {
      currentTime = 0;
      duration = 4;
      playbackRate = 1;
      src = "";
      addEventListener(type: string, handler: () => void) {
        if (type === "loadedmetadata") {
          handler();
        }
      }
      play = play;
      pause = vi.fn();
    }
    vi.stubGlobal("Audio", FakeAudio);
    fireEvent.click(document.querySelector("canvas") as HTMLCanvasElement);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: en.media.pause })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: en.media.pause }));
    await user.click(screen.getByRole("button", { name: en.media.play }));
    await user.click(screen.getByRole("button", { name: en.media.pause }));
    await user.click(screen.getByRole("button", { name: en.media.speed.replace("{{rate}}", "1×") }));
    fireEvent.click(document.querySelector("canvas") as HTMLCanvasElement);
    await user.click(screen.getByRole("button", { name: en.media.download }));
    resetVoicePlayer();
    vi.unstubAllGlobals();
  });
});

describe("gallery panel", () => {
  it("switches tabs on a live conversation", async () => {
    const user = userEvent.setup();
    setAccessSession(testSession());
    render(
      <AppProviders>
        <MediaGalleryPanel conversationId="1" />
        <MediaGalleryPanel conversationId="ada" />
      </AppProviders>,
    );
    expect(document.querySelector("[data-media-gallery]")).not.toBeNull();
    await user.click(screen.getAllByRole("tab", { name: en.media.tabs.files })[0]!);
    await waitFor(() => {
      expect(document.querySelector("[data-gallery-files]")).not.toBeNull();
    });
    await user.click(screen.getAllByRole("tab", { name: en.media.tabs.links })[0]!);
    await user.click(screen.getAllByRole("tab", { name: en.media.tabs.images })[0]!);
    await user.click(await screen.findByRole("button", { name: en.media.photo }));
    expect(document.querySelector("[data-media-lightbox]")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: en.ui.close }));
    await user.click((await screen.findAllByRole("button", { name: en.media.load_more }))[0]!);
    await user.click(screen.getAllByRole("tab", { name: en.media.tabs.links })[0]!);
    expect((await screen.findAllByText("https://example.org/bare")).length).toBeGreaterThan(0);
    render(
      <AppProviders>
        <MediaGalleryPanel conversationId="998" />
      </AppProviders>,
    );
    await user.click((await screen.findAllByRole("button", { name: en.lists.error_retry }))[0]!);
    await user.click(screen.getAllByRole("tab", { name: en.media.tabs.files }).at(-1)!);
    await user.click(screen.getAllByRole("button", { name: en.lists.error_retry })[0]!);
    await user.click(screen.getAllByRole("tab", { name: en.media.tabs.links }).at(-1)!);
    await user.click(screen.getAllByRole("button", { name: en.lists.error_retry })[0]!);
  });
});

describe("standalone bubbles", () => {
  it("renders video and document helpers", async () => {
    setAccessSession(testSession());
    render(
      <AppProviders>
        <RemoteProgressiveImage
          alt={en.media.photo}
          attachment={{
            byte_size: 1,
            content_type: "image/png",
            id: 12,
            kind: "image",
            processing_status: "pending",
          }}
        />
        <RemoteProgressiveImage
          alt={en.media.photo}
          attachment={{
            byte_size: 1,
            content_type: "image/png",
            id: 13,
            kind: "image",
            processing_status: "pending",
          }}
          wantFull={false}
        />
        <RemoteProgressiveImage
          alt={en.media.photo}
          attachment={readyImage(11)}
          onClick={() => undefined}
          wantFull
        />
        <VideoBubble
          attachment={{
            byte_size: 1,
            content_type: "video/mp4",
            id: 8,
            kind: "video",
            processing_status: "pending",
          }}
        />
        <DocumentBubble
          attachment={{
            byte_size: 12,
            content_type: "application/octet-stream",
            id: 9,
            kind: "file",
            processing_status: "pending",
          }}
        />
        <VoiceNote
          attachment={{
            byte_size: 1,
            content_type: "audio/ogg",
            id: 10,
            kind: "voice",
            processing_status: "pending",
          }}
          messageId="n"
        />
      </AppProviders>,
    );
    expect(document.querySelector("[data-video-bubble]")).not.toBeNull();
    await waitFor(() => {
      expect(document.querySelector("[data-progressive-stage] img")).not.toBeNull();
    });
  });
});
