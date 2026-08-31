import { afterEach, describe, expect, it, vi } from "vitest";
import { presignAndUpload } from "./direct-upload";
import * as http from "@/features/media/api/http";
import { FALLBACK_STICKER_NAME, FALLBACK_STICKER_TYPE } from "@/features/media/model/constants";

describe("presignAndUpload", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the signed id when the blob is already stored", async () => {
    vi.spyOn(http, "createDirectUpload").mockResolvedValue({
      blob_signed_id: "signed",
      skip_upload: true,
    });
    const file = new File(["x"], "wave.png", { type: "image/png" });
    await expect(presignAndUpload(file)).resolves.toBe("signed");
  });

  it("falls back to a sticker name and type, then PUTs the file", async () => {
    vi.spyOn(http, "createDirectUpload").mockResolvedValue({
      blob_signed_id: "uploaded",
      skip_upload: false,
      direct_upload_url: "https://media.test/put",
      headers: { "Content-Type": FALLBACK_STICKER_TYPE },
    });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));
    const file = new File(["x"], "   ", { type: "" });
    await expect(presignAndUpload(file)).resolves.toBe("uploaded");
    expect(http.createDirectUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: FALLBACK_STICKER_NAME,
        content_type: FALLBACK_STICKER_TYPE,
      }),
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://media.test/put",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("rejects a missing upload URL and a failed PUT", async () => {
    vi.spyOn(http, "createDirectUpload").mockResolvedValueOnce({
      blob_signed_id: "missing",
      skip_upload: false,
    });
    await expect(presignAndUpload(new File(["x"], "a.png", { type: "image/png" }))).rejects.toThrow(
      "direct_upload_url_missing",
    );
    vi.spyOn(http, "createDirectUpload").mockResolvedValueOnce({
      blob_signed_id: "fail",
      skip_upload: false,
      direct_upload_url: "https://media.test/put",
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(null, { status: 500 }));
    await expect(presignAndUpload(new File(["x"], "a.png", { type: "image/png" }))).rejects.toThrow(
      "direct_upload_put_failed",
    );
  });
});
