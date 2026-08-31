import { ChevronLeft } from "lucide-react";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useLayerStore } from "@/shared/lib/navigation/layer-store";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";
import { cn } from "@/shared/lib/cn";

export function LayerHeader({
  children,
  onBack,
  onTitleClick,
  showBack = true,
  title,
}: {
  children?: ReactNode;
  onBack?: () => void;
  onTitleClick?: () => void;
  showBack?: boolean;
  title: string;
}): ReactNode {
  const { t } = useTranslation();
  const popLayer = useLayerStore((state) => state.popLayer);
  return (
    <header className="flex items-center gap-[var(--control-gap)] px-[var(--space-list-x)] py-[var(--space-list-y)]">
      {showBack ? (
        <IconButton aria-label={t("shell.back")} onClick={() => (onBack ?? popLayer)()} type="button">
          <ChevronLeft className="h-[var(--icon-size)] w-[var(--icon-size)]" />
        </IconButton>
      ) : null}
      {onTitleClick ? (
        <Button
          aria-label={t("shell.open_profile")}
          className={cn("min-w-0 flex-1 justify-start truncate", WEIGHT_EMPHASIS)}
          onClick={onTitleClick}
          type="button"
          variant="ghost"
        >
          {title}
        </Button>
      ) : (
        <p className={cn("min-w-0 flex-1 truncate", WEIGHT_EMPHASIS)}>{title}</p>
      )}
      {children}
    </header>
  );
}
