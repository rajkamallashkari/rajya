import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import { AVATAR_INITIALS_LENGTH, AVATAR_TONES } from "@/shared/ui/metrics";

export type Presence = "online" | "offline" | "away";

export interface AvatarProps {
  src?: string | null;
  name?: string | null;
  presence?: Presence;
  className?: string;
}

const SIZE = "h-[var(--avatar-size)] w-[var(--avatar-size)]";

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  const second = parts[1];
  if (first && second) {
    return `${first[0]}${second[0]}`.toUpperCase();
  }
  return (first ?? "").slice(0, AVATAR_INITIALS_LENGTH).toUpperCase();
}

export function avatarTone(name: string): (typeof AVATAR_TONES)[number] {
  const sum = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_TONES[sum % AVATAR_TONES.length] as (typeof AVATAR_TONES)[number];
}

function presenceClass(presence: Presence): string {
  if (presence === "online") {
    return "bg-[var(--status-success)]";
  }
  if (presence === "away") {
    return "bg-[var(--status-warning)]";
  }
  return "bg-[var(--text-tertiary)]";
}

export function Avatar({ src, name, presence, className }: AvatarProps) {
  const { t } = useTranslation();
  const label = name?.trim() ? name : t("ui.avatar_unnamed");
  const initials = name?.trim() ? initialsFromName(name) : "";
  const tone = avatarTone(name?.trim() ? name : label);

  return (
    <AvatarPrimitive.Root
      className={cn("relative inline-flex shrink-0", SIZE, className)}
      aria-label={label}
    >
      {src ? (
        <AvatarPrimitive.Image
          src={src}
          alt={label}
          className={cn(SIZE, "rounded-[var(--radius-full)] object-cover")}
        />
      ) : null}
      <AvatarPrimitive.Fallback
        className={cn(
          SIZE,
          "flex items-center justify-center rounded-[var(--radius-full)] text-[length:var(--text-sm)] [font-weight:var(--font-weight-emphasis)] text-[var(--accent-contrast)]",
        )}
        style={{ background: `var(${tone})` }}
        delayMs={0}
      >
        {initials ? (
          initials
        ) : (
          <User className="h-[var(--avatar-icon-size)] w-[var(--avatar-icon-size)]" />
        )}
      </AvatarPrimitive.Fallback>
      {presence ? (
        <span
          data-presence={presence}
          className={cn(
            "absolute right-0 bottom-0 h-[var(--presence-size)] w-[var(--presence-size)] rounded-[var(--radius-full)] ring-[length:var(--focus-ring-width)] ring-[var(--surface-panel)]",
            presenceClass(presence),
          )}
        />
      ) : null}
    </AvatarPrimitive.Root>
  );
}
