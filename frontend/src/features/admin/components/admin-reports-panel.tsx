import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  useAdminReport,
  useAdminReports,
  useDeactivateAdminReportAccount,
  useDismissAdminReport,
  useRemoveAdminReportContent,
  useWarnAdminReport,
} from "@/features/admin/api/queries";
import {
  REPORT_STATUSES,
  REPORT_SUBJECT_TYPES,
  type ReportStatus,
  type ReportSubjectType,
} from "@/features/admin/model/constants";
import { parseReportAgeHours, queryListStatus } from "@/features/admin/model/display";
import { Button, Input, ListView, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export function AdminReportsPanel(): ReactNode {
  const { t } = useTranslation();
  const [status, setStatus] = useState("");
  const [subjectType, setSubjectType] = useState("");
  const [age, setAge] = useState("all");
  const listed = useAdminReports({
    maxAgeHours: parseReportAgeHours(age),
    status: status || undefined,
    subjectType: subjectType || undefined,
  });
  const rows = listed.data?.reports ?? [];
  return (
    <div className="flex flex-col gap-[var(--control-gap)]" data-admin-reports="">
      <h1 className={WEIGHT_EMPHASIS}>{t("admin.reports")}</h1>
      <Select onValueChange={(value) => setStatus(value === "all" ? "" : value)} value={status || "all"}>
        <SelectTrigger aria-label={t("admin.status")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("admin.age_all")}</SelectItem>
          {REPORT_STATUSES.map((value) => (
            <SelectItem key={value} value={value}>
              {t(`admin.status_${value}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        onValueChange={(value) => setSubjectType(value === "all" ? "" : value)}
        value={subjectType || "all"}
      >
        <SelectTrigger aria-label={t("admin.subject_type")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("admin.age_all")}</SelectItem>
          {REPORT_SUBJECT_TYPES.map((value) => (
            <SelectItem key={value} value={value}>
              {t(`admin.subject_${value}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select onValueChange={setAge} value={age}>
        <SelectTrigger aria-label={t("admin.age")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("admin.age_all")}</SelectItem>
          <SelectItem value="day">{t("admin.age_day")}</SelectItem>
          <SelectItem value="week">{t("admin.age_week")}</SelectItem>
          <SelectItem value="month">{t("admin.age_month")}</SelectItem>
        </SelectContent>
      </Select>
      <ListView
        onRetry={() => void listed.refetch()}
        status={queryListStatus(listed.isPending, listed.isError, rows.length === 0)}
      >
        <ul className="flex flex-col">
          {rows.map((row) => (
            <li key={row.id}>
              <Button asChild className="h-auto w-full justify-start" variant="ghost">
                <Link to={`/admin/reports/${String(row.id)}`}>
                  <span className="flex min-w-0 flex-col items-start gap-[var(--space-1)]">
                    <span className={WEIGHT_EMPHASIS}>{row.subject.label}</span>
                    <span className="text-[var(--text-secondary)]">
                      {t(`admin.status_${row.status as ReportStatus}`)} · {row.reason}
                    </span>
                  </span>
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </ListView>
    </div>
  );
}

export function AdminReportDetailPanel(): ReactNode {
  const { t } = useTranslation();
  const params = useParams();
  const id = Number(params.reportId);
  const shown = useAdminReport(id);
  const dismiss = useDismissAdminReport();
  const warn = useWarnAdminReport();
  const removeContent = useRemoveAdminReportContent();
  const deactivate = useDeactivateAdminReportAccount();
  const [note, setNote] = useState("");
  const row = shown.data;
  const subjectType = row?.subject_type as ReportSubjectType | undefined;
  return (
    <div className="flex flex-col gap-[var(--control-gap)]" data-admin-report="">
      <h1 className={WEIGHT_EMPHASIS}>{t("admin.moderation")}</h1>
      <ListView
        onRetry={() => void shown.refetch()}
        status={queryListStatus(shown.isPending, shown.isError, row == null)}
      >
        {row ? (
          <div className="flex flex-col gap-[var(--control-gap)]">
            <p className={WEIGHT_EMPHASIS}>{row.subject.label}</p>
            <p>{row.reason}</p>
            {row.subject.body ? <p>{row.subject.body}</p> : null}
            {row.subject.conversation_id ? (
              <Button asChild variant="ghost">
                <Link to={`/admin/conversations/${String(row.subject.conversation_id)}`}>
                  {t("admin.transcript")}
                </Link>
              </Button>
            ) : null}
            <Input
              aria-label={t("admin.note")}
              onChange={(event) => setNote(event.target.value)}
              value={note}
            />
            <div className="flex flex-wrap gap-[var(--control-gap)]">
              <Button onClick={() => dismiss.mutate({ id: row.id, note: note.trim() || undefined })} type="button">
                {t("admin.dismiss")}
              </Button>
              <Button onClick={() => warn.mutate({ id: row.id, note: note.trim() || undefined })} type="button">
                {t("admin.warn")}
              </Button>
              {subjectType === "message" || subjectType === "bot" ? (
                <Button onClick={() => removeContent.mutate(row.id)} type="button" variant="secondary">
                  {t("admin.remove_content")}
                </Button>
              ) : null}
              {subjectType === "conversation" ? null : (
                <Button onClick={() => deactivate.mutate(row.id)} type="button" variant="secondary">
                  {t("admin.deactivate_account")}
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </ListView>
    </div>
  );
}
