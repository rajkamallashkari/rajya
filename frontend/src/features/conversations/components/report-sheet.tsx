import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ReportReason, ReportSubjectType } from "@/features/conversations/model/report";
import { Button, Textarea } from "@/shared/ui";
import { BottomSheet, BottomSheetContent, BottomSheetTitle } from "@/shared/ui/bottom-sheet";
import { EmptyState } from "@/shared/ui/empty-state";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio";

export function ReportSheet({
  onOpenChange,
  onSubmit,
  open,
  reasons,
  subjectType,
}: {
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { details: string; reasonId: string }) => void;
  open: boolean;
  reasons: ReportReason[];
  subjectType: ReportSubjectType;
}) {
  const { t } = useTranslation();
  const [reasonId, setReasonId] = useState(reasons[0]?.id ?? "");
  const [details, setDetails] = useState("");
  const selected = reasons.some((reason) => reason.id === reasonId)
    ? reasonId
    : (reasons[0]?.id ?? "");
  const canSubmit = selected.length > 0;

  return (
    <BottomSheet onOpenChange={onOpenChange} open={open}>
      <BottomSheetContent>
        <BottomSheetTitle>{t("report.title")}</BottomSheetTitle>
        <p className="mb-[var(--space-3)] text-[var(--text-secondary)]">
          {t(`report.subject.${subjectType}`)}
        </p>
        {reasons.length === 0 ? (
          <EmptyState title={t("report.no_reasons")} />
        ) : (
          <RadioGroup aria-label={t("report.reason")} onValueChange={setReasonId} value={selected}>
            {reasons.map((reason) => (
              <label
                className="flex min-h-[var(--control-height)] items-center gap-[var(--control-gap-tight)]"
                key={reason.id}
              >
                <RadioGroupItem value={reason.id} />
                <span>{reason.label}</span>
              </label>
            ))}
          </RadioGroup>
        )}
        <label className="mt-[var(--space-3)] flex flex-col gap-[var(--space-1)]">
          <span>{t("report.details")}</span>
          <Textarea
            onChange={(event) => setDetails(event.target.value)}
            placeholder={t("report.details_placeholder")}
            value={details}
          />
        </label>
        <Button
          className="mt-[var(--space-4)]"
          disabled={!canSubmit}
          onClick={() => onSubmit({ details, reasonId: selected })}
          type="button"
        >
          {t("report.submit")}
        </Button>
      </BottomSheetContent>
    </BottomSheet>
  );
}
