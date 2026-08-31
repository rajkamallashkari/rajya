import { Volume1, Volume2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toggleSpeaker } from "@/features/calls/lib";
import { useCallStore } from "@/features/calls/store/call-store";
import { cn } from "@/shared/lib/cn";
import { IconButton } from "@/shared/ui/icon-button";
import { ICON_CLASS } from "@/shared/ui/metrics";

export function SpeakerToggle({ className }: { className?: string }) {
  const { t } = useTranslation();
  const speakerOn = useCallStore((state) => state.speakerOn);
  return (
    <IconButton
      aria-label={speakerOn ? t("calls.speaker_on") : t("calls.speaker_off")}
      aria-pressed={speakerOn}
      className={cn(
        "rounded-[var(--radius-full)]",
        speakerOn
          ? "bg-[var(--text-inverse)] text-[var(--surface-call)]"
          : "bg-[var(--call-chrome)] text-[var(--text-inverse)]",
        className,
      )}
      onClick={() => void toggleSpeaker()}
      type="button"
      variant="ghost"
    >
      {speakerOn ? <Volume2 aria-hidden className={ICON_CLASS} /> : <Volume1 aria-hidden className={ICON_CLASS} />}
    </IconButton>
  );
}
