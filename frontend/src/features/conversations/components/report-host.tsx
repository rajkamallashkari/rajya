import { useCreateReport, useReportReasons } from "@/features/conversations/api/queries";
import { ReportSheet } from "@/features/conversations/components/report-sheet";
import type { ReportSubjectType } from "@/features/conversations/model/report";

export function ReportHost({
  onOpenChange,
  open,
  subjectId,
  subjectType,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  subjectId: number;
  subjectType: ReportSubjectType;
}) {
  const reasons = useReportReasons();
  const create = useCreateReport();
  return (
    <ReportSheet
      onOpenChange={onOpenChange}
      onSubmit={({ details, reasonId }) => {
        create.mutate(
          { details, reason: reasonId, subject_id: subjectId, subject_type: subjectType },
          { onSuccess: () => onOpenChange(false) },
        );
      }}
      open={open}
      reasons={reasons.data?.reasons ?? []}
      subjectType={subjectType}
    />
  );
}
