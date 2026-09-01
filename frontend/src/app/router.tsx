import { Suspense, lazy, useState, type ReactNode } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import { RouteErrorBoundary } from "@/app/error-boundaries/error-boundary";
import { AppShell } from "@/app/shell";
import { InvitePage } from "@/features/conversations/components/invite-page";
import {
  lazyAdmin,
  loadAccountsPage,
  loadGalleryPage,
  type AdminTreeExport,
} from "@/shared/lib/chunks";
import { ChunkFallback } from "@/shared/ui/chunk-fallback";

const GalleryPage = lazy(() => loadGalleryPage().then((mod) => ({ default: mod.GalleryPage })));
const AccountsDevPage = lazy(() =>
  loadAccountsPage().then((mod) => ({ default: mod.AccountsDevPage })),
);

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
      <Suspend asPage>
        <GalleryPage />
      </Suspend>
    </RouteErrorBoundary>
  );
}

function AccountsRoute() {
  return (
    <RouteErrorBoundary>
      <Suspend asPage>
        <AccountsDevPage />
      </Suspend>
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

function Suspend({ children, asPage = false }: { asPage?: boolean; children: ReactNode }) {
  return <Suspense fallback={<ChunkFallback asPage={asPage} />}>{children}</Suspense>;
}

function adminPage(name: AdminTreeExport, asPage = false) {
  const Panel = lazyAdmin(name);
  return (
    <Suspend asPage={asPage}>
      <Panel />
    </Suspend>
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
    element: adminPage("AdminRoute", true),
    children: [
      { index: true, element: adminPage("AdminDashboardPanel") },
      { path: "users", element: adminPage("AdminUsersPanel") },
      { path: "users/:userId", element: adminPage("AdminUserDetailPanel") },
      { path: "conversations/:conversationId", element: adminPage("AdminTranscriptPanel") },
      { path: "bots", element: adminPage("AdminBotsPanel") },
      { path: "reports", element: adminPage("AdminReportsPanel") },
      { path: "reports/:reportId", element: adminPage("AdminReportDetailPanel") },
      { path: "packs", element: adminPage("AdminPacksPanel") },
      { path: "audit", element: adminPage("AdminAuditPanel") },
      { path: "config", element: adminPage("AdminConfigPanel") },
      { path: "prompts", element: adminPage("AdminPromptsPanel") },
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
