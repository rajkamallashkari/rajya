import { useTranslation } from "react-i18next";
import { useResolvedTheme } from "@/app/theme-provider";
import { useComposeStore } from "@/features/conversations/store/compose-store";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { Logo } from "@/shared/ui/logo";
import { type ReactNode } from "react";

export function ChatsWelcome(): ReactNode {
  const { t } = useTranslation();
  const resolvedTheme = useResolvedTheme();
  const setMenuOpen = useComposeStore((state) => state.setMenuOpen);
  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col items-center justify-center bg-[var(--surface-chat)]"
      data-chats-welcome=""
    >
      <EmptyState
        action={
          <Button onClick={() => setMenuOpen(true)} type="button">
            {t("shell.welcome_action")}
          </Button>
        }
        className="h-full"
        description={t("shell.welcome_description")}
        icon={<Logo resolvedTheme={resolvedTheme} />}
        title={t("shell.welcome_title")}
      />
    </div>
  );
}
