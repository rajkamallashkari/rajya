import { decode } from "blurhash";
import { BLURHASH_PIXELS } from "@/features/media/model/constants";

export function paintBlurhash(canvas: HTMLCanvasElement, hash: string): boolean {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return false;
  }
  try {
    const pixels = decode(hash, BLURHASH_PIXELS, BLURHASH_PIXELS);
    const image = ctx.createImageData(BLURHASH_PIXELS, BLURHASH_PIXELS);
    image.data.set(pixels);
    ctx.putImageData(image, 0, 0);
    return true;
  } catch {
    return false;
  }
}

export function progressiveStage(thumbLoaded: boolean, fullLoaded: boolean): "placeholder" | "thumb" | "full" {
  if (fullLoaded) {
    return "full";
  }
  if (thumbLoaded) {
    return "thumb";
  }
  return "placeholder";
}
