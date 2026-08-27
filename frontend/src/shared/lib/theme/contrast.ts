const AA_RATIO = 4.5;
const LUMINANCE_OFFSET = 0.05;
const SRGB_CUTOFF = 0.03928;
const SRGB_LINEAR_DIVISOR = 12.92;
const SRGB_GAMMA_OFFSET = 0.055;
const SRGB_GAMMA_DIVISOR = 1.055;
const SRGB_GAMMA = 2.4;
const CHANNEL_MAX = 255;
const HEX_PAIR = 2;
const RED_WEIGHT = 0.2126;
const GREEN_WEIGHT = 0.7152;
const BLUE_WEIGHT = 0.0722;
const HEX_BODY = 6;
const HEX_PREFIX = "#";

function hexDigits(hex: string): string | null {
  if (!hex.startsWith(HEX_PREFIX)) {
    return null;
  }
  const body = hex.slice(HEX_PREFIX.length);
  if (body.length !== HEX_BODY) {
    return null;
  }
  return body;
}

function srgbChannels(hex: string): [number, number, number] | null {
  const body = hexDigits(hex);
  if (body === null) {
    return null;
  }
  const red = Number.parseInt(body.slice(0, HEX_PAIR), 16) / CHANNEL_MAX;
  const green = Number.parseInt(body.slice(HEX_PAIR, HEX_PAIR + HEX_PAIR), 16) / CHANNEL_MAX;
  const blue = Number.parseInt(body.slice(HEX_PAIR + HEX_PAIR, HEX_BODY), 16) / CHANNEL_MAX;
  if (Number.isNaN(red) || Number.isNaN(green) || Number.isNaN(blue)) {
    return null;
  }
  return [red, green, blue];
}

function linearize(channel: number): number {
  if (channel <= SRGB_CUTOFF) {
    return channel / SRGB_LINEAR_DIVISOR;
  }
  return ((channel + SRGB_GAMMA_OFFSET) / SRGB_GAMMA_DIVISOR) ** SRGB_GAMMA;
}

export function relativeLuminance(hex: string): number | null {
  const channels = srgbChannels(hex);
  if (channels === null) {
    return null;
  }
  const [red, green, blue] = channels;
  return (
    RED_WEIGHT * linearize(red) + GREEN_WEIGHT * linearize(green) + BLUE_WEIGHT * linearize(blue)
  );
}

export function contrastRatio(left: string, right: string): number | null {
  const first = relativeLuminance(left);
  const second = relativeLuminance(right);
  if (first === null || second === null) {
    return null;
  }
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + LUMINANCE_OFFSET) / (darker + LUMINANCE_OFFSET);
}

export function sufficientContrast(foreground: string, background: string): boolean {
  const ratio = contrastRatio(foreground, background);
  return ratio !== null && ratio >= AA_RATIO;
}

export function accentContrast(hex: string, white: string, nearBlack: string): string {
  const whiteRatio = contrastRatio(hex, white);
  const blackRatio = contrastRatio(hex, nearBlack);
  if (whiteRatio === null && blackRatio === null) {
    return white;
  }
  if (whiteRatio === null) {
    return nearBlack;
  }
  if (blackRatio === null) {
    return white;
  }
  return whiteRatio >= blackRatio ? white : nearBlack;
}
