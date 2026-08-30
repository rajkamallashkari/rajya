import { MUTE_DURATIONS } from "@/features/conversations/model/settings";

export const MUTE_LABEL_KEYS = ["mute_1h", "mute_8h", "mute_24h", "mute_until_on"] as const;

export function muteDurationOptions(): { seconds: number; labelKey: string }[] {
  return MUTE_DURATIONS.map((seconds, index) => ({
    seconds,
    labelKey: `conversations.${MUTE_LABEL_KEYS[index] as (typeof MUTE_LABEL_KEYS)[number]}`,
  }));
}
