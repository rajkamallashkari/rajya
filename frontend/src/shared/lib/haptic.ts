export const HAPTIC_DURATION_MS = 10;

export function haptic(durationMs: number = HAPTIC_DURATION_MS): void {
  navigator.vibrate?.(durationMs);
}
