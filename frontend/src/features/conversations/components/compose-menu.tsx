import { Megaphone, MessageSquare, MessageSquarePlus, Radio, Users } from "lucide-react";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useComposeStore } from "@/features/conversations/store/compose-store";
import {
  composeGroupLayer,
  composeMessageLayer,
  useLayerStore,
} from "@/shared/lib/navigation/layer-store";
import { Badge } from "@/shared/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { IconButton } from "@/shared/ui/icon-button";
import { ICON_CLASS } from "@/shared/ui/metrics";

export function ComposeMenu(): ReactNode {
  const { t } = useTranslation();
  const pushLayer = useLayerStore((state) => state.pushLayer);
  const menuOpen = useComposeStore((state) => state.menuOpen);
  const setMenuOpen = useComposeStore((state) => state.setMenuOpen);

  return (
    <div className="relative" data-compose-wrap="">
      <DropdownMenu onOpenChange={setMenuOpen} open={menuOpen}>
        <DropdownMenuTrigger asChild>
          <IconButton
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={t("compose.new_conversation")}
          >
            <MessageSquarePlus className={ICON_CLASS} />
          </IconButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="gap-[var(--control-gap)]"
            onSelect={() => pushLayer(composeMessageLayer(t("compose.message")))}
          >
            <MessageSquare className={ICON_CLASS} />
            {t("compose.message")}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-[var(--control-gap)]"
            onSelect={() => pushLayer(composeGroupLayer(t("compose.group")))}
          >
            <Users className={ICON_CLASS} />
            {t("compose.group")}
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-[var(--control-gap)]" disabled>
            <Radio className={ICON_CLASS} />
            <span className="flex-1">{t("compose.channel")}</span>
            <Badge variant="muted">{t("compose.soon")}</Badge>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-[var(--control-gap)]" disabled>
            <Megaphone className={ICON_CLASS} />
            <span className="flex-1">{t("compose.broadcast")}</span>
            <Badge variant="muted">{t("compose.soon")}</Badge>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
