import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useResolvedTheme } from "@/app/theme-provider";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { Logo } from "@/shared/ui/logo";

export function ChatsWelcome(): ReactNode {
  const { t } = useTranslation();
  const resolvedTheme = useResolvedTheme();
  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col items-center justify-center bg-[var(--surface-chat)]"
      data-chats-welcome=""
    >
      <EmptyState
        action={<Button type="button">{t("shell.welcome_action")}</Button>}
        className="h-full"
        description={t("shell.welcome_description")}
        icon={<Logo resolvedTheme={resolvedTheme} />}
        title={t("shell.welcome_title")}
      />
    </div>
  );
}
