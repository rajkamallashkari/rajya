import { toString as renderQrString } from "qrcode";

export const QR_ERROR_CORRECTION = "M";
export const QR_QUIET_ZONE_MODULES = 4;
export const QR_RENDER_PX = 512;

export async function qrImageDataUrl(payload: string): Promise<string | null> {
  try {
    const svg = await renderQrString(payload, {
      errorCorrectionLevel: QR_ERROR_CORRECTION,
      margin: QR_QUIET_ZONE_MODULES,
      type: "svg",
      width: QR_RENDER_PX,
    });
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  } catch {
    return null;
  }
}
