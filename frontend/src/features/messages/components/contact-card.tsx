import { useTranslation } from "react-i18next";
import { Avatar, Button } from "@/shared/ui";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export interface ContactView {
  contactAccountId: string | null;
  displayName: string;
  email: string | null;
  phone: string | null;
}

export function ContactCard({
  contact,
  onMessage,
  onOpenProfile,
}: {
  contact: ContactView;
  onMessage?: () => void;
  onOpenProfile?: () => void;
}) {
  const { t } = useTranslation();
  const inApp = contact.contactAccountId !== null;
  return (
    <article
      className="flex min-w-0 flex-col gap-[var(--space-2)] rounded-[var(--radius-bubble)] bg-[var(--surface-raised)] p-[var(--space-3)]"
      data-contact-card=""
      data-in-app={inApp ? "true" : "false"}
    >
      <div className="flex items-center gap-[var(--control-gap)]">
        <Avatar name={contact.displayName} />
        <div className="min-w-0">
          <p className={WEIGHT_EMPHASIS}>{contact.displayName}</p>
          {contact.phone ? (
            <p className="text-[var(--text-secondary)]">
              {t("contact.phone", { value: contact.phone })}
            </p>
          ) : null}
          {contact.email ? (
            <p className="text-[var(--text-secondary)]">
              {t("contact.email", { value: contact.email })}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-[var(--space-2)]">
        {inApp && onOpenProfile ? (
          <Button onClick={onOpenProfile} type="button" variant="secondary">
            {t("contact.open_profile")}
          </Button>
        ) : null}
        {onMessage ? (
          <Button onClick={onMessage} type="button">
            {t("contact.message")}
          </Button>
        ) : null}
      </div>
    </article>
  );
}
