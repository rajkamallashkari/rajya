import { useState } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import { GalleryPage } from "@/app/dev/gallery-page";
import { AccountsDevPage } from "@/app/dev/accounts-page";
import { RouteErrorBoundary } from "@/app/error-boundaries/error-boundary";
import { AppShell } from "@/app/shell";
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
import { InvitePage } from "@/features/conversations/components/invite-page";

function ShellRoute() {
  return (
    <RouteErrorBoundary>
      <AppShell />
    </RouteErrorBoundary>
  );
}

function GalleryRoute() {
  return (
    <RouteErrorBoundary>
      <GalleryPage />
    </RouteErrorBoundary>
  );
}

function AccountsRoute() {
  return (
    <RouteErrorBoundary>
      <AccountsDevPage />
    </RouteErrorBoundary>
  );
}

function InviteRoute() {
  return (
    <RouteErrorBoundary>
      <InvitePage />
    </RouteErrorBoundary>
  );
}

function AdminRoute() {
  return (
    <RouteErrorBoundary>
      <AdminShell />
    </RouteErrorBoundary>
  );
}

export const appRoutes = [
  { path: "/", element: <ShellRoute /> },
  { path: "/c/:conversationId", element: <ShellRoute /> },
  { path: "/c/:conversationId/m/:messageId", element: <ShellRoute /> },
  { path: "/m/:messageId", element: <ShellRoute /> },
  { path: "/invite/:token", element: <InviteRoute /> },
  { path: "/dev/gallery", element: <GalleryRoute /> },
  { path: "/dev/accounts", element: <AccountsRoute /> },
  {
    path: "/admin",
    element: <AdminRoute />,
    children: [
      { index: true, element: <AdminDashboardPanel /> },
      { path: "users", element: <AdminUsersPanel /> },
      { path: "users/:userId", element: <AdminUserDetailPanel /> },
      { path: "conversations/:conversationId", element: <AdminTranscriptPanel /> },
      { path: "bots", element: <AdminBotsPanel /> },
      { path: "reports", element: <AdminReportsPanel /> },
      { path: "reports/:reportId", element: <AdminReportDetailPanel /> },
      { path: "packs", element: <AdminPacksPanel /> },
      { path: "audit", element: <AdminAuditPanel /> },
      { path: "config", element: <AdminConfigPanel /> },
      { path: "prompts", element: <AdminPromptsPanel /> },
    ],
  },
];

export function createRouter() {
  return createBrowserRouter(appRoutes);
}

export function AppRouter() {
  const [router] = useState(createRouter);
  return <RouterProvider router={router} />;
}
