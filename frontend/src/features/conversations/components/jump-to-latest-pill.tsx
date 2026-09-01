import { ChevronsDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatUnread } from "@/features/conversations/model/unread";
import { Badge } from "@/shared/ui/badge";
import { IconButton } from "@/shared/ui/icon-button";
import { ICON_CLASS } from "@/shared/ui/metrics";

export function JumpToLatestPill({
  count,
  onJump,
}: {
  count: number;
  onJump: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="absolute bottom-[var(--space-4)] left-[var(--space-3)] z-[var(--z-sticky)]">
      <IconButton
        aria-label={t("conversations.jump_to_latest")}
        data-jump-to-latest=""
        onClick={onJump}
        type="button"
        variant="primary"
      >
        <ChevronsDown className={ICON_CLASS} />
        <Badge className="absolute -top-[var(--space-2)] -right-[var(--space-2)]" variant="accent">
          {formatUnread(count)}
        </Badge>
      </IconButton>
    </div>
  );
}
