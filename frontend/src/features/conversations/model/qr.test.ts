import { create } from "qrcode";
import { describe, expect, it } from "vitest";
import { inviteUrl, profileUrl } from "./links";
import { QR_ERROR_CORRECTION, QR_QUIET_ZONE_MODULES, QR_RENDER_PX, qrImageDataUrl } from "./qr";

const PREFIX = "data:image/svg+xml;charset=utf-8,";

function svgFor(dataUrl: string | null): string {
  expect(dataUrl?.startsWith(PREFIX)).toBe(true);
  return decodeURIComponent((dataUrl ?? "").slice(PREFIX.length));
}

function expectedViewBox(payload: string): string {
  const size = create(payload, { errorCorrectionLevel: QR_ERROR_CORRECTION }).modules.size;
  const span = size + QR_QUIET_ZONE_MODULES * 2;
  return `viewBox="0 0 ${span} ${span}"`;
}

describe("qrImageDataUrl", () => {
  it("encodes a profile url as an svg data url with a spec quiet zone", async () => {
    const payload = profileUrl("https://rajya.pages.dev", "ada lovelace#/?");
    expect(payload).toBe("https://rajya.pages.dev/u/ada%20lovelace%23%2F%3F");

    const dataUrl = await qrImageDataUrl(payload);
    const svg = svgFor(dataUrl);

    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain(`width="${QR_RENDER_PX}" height="${QR_RENDER_PX}"`);
    expect(svg).toContain(expectedViewBox(payload));
    expect(svg).toMatch(/<path [^>]*\sd="M\d/);
    expect(dataUrl).not.toContain("#");
    expect(svg).not.toContain("<script");
  });

  it("encodes an invite url and scales the matrix with payload length", async () => {
    const short = inviteUrl("https://rajya.pages.dev", "abc");
    const long = inviteUrl("https://rajya.pages.dev", "a".repeat(200));
    expect(short).toBe("https://rajya.pages.dev/invite/abc");

    const shortSvg = svgFor(await qrImageDataUrl(short));
    const longSvg = svgFor(await qrImageDataUrl(long));

    expect(shortSvg).toContain(expectedViewBox(short));
    expect(longSvg).toContain(expectedViewBox(long));
    expect(longSvg.length).toBeGreaterThan(shortSvg.length);
  });

  it("returns null when the payload cannot fit in a qr code", async () => {
    await expect(qrImageDataUrl("x".repeat(4000))).resolves.toBeNull();
  });
});
