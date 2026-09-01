import { RouteErrorBoundary } from "@/app/error-boundaries/error-boundary";
import {
  AdminAuditPanel,
  AdminBotsPanel,
  AdminConfigPanel,
  AdminDashboardPanel,
  AdminPacksPanel,
  AdminPromptsPanel,
  AdminReportDetailPanel,
  AdminReportsPanel,
  AdminShell,
  AdminTranscriptPanel,
  AdminUserDetailPanel,
  AdminUsersPanel,
} from "@/features/admin";

export function AdminRoute() {
  return (
    <RouteErrorBoundary>
      <AdminShell />
    </RouteErrorBoundary>
  );
}

export {
  AdminAuditPanel,
  AdminBotsPanel,
  AdminConfigPanel,
  AdminDashboardPanel,
  AdminPacksPanel,
  AdminPromptsPanel,
  AdminReportDetailPanel,
  AdminReportsPanel,
  AdminTranscriptPanel,
  AdminUserDetailPanel,
  AdminUsersPanel,
};
