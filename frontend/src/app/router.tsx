import { useState } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import { GalleryPage } from "@/app/dev/gallery-page";
import { AccountsDevPage } from "@/app/dev/accounts-page";
import { RouteErrorBoundary } from "@/app/error-boundaries/error-boundary";
import { AppShell } from "@/app/shell";
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

export const appRoutes = [
  { path: "/", element: <ShellRoute /> },
  { path: "/c/:conversationId", element: <ShellRoute /> },
  { path: "/c/:conversationId/m/:messageId", element: <ShellRoute /> },
  { path: "/m/:messageId", element: <ShellRoute /> },
  { path: "/invite/:token", element: <InviteRoute /> },
  { path: "/dev/gallery", element: <GalleryRoute /> },
  { path: "/dev/accounts", element: <AccountsRoute /> },
];

export function createRouter() {
  return createBrowserRouter(appRoutes);
}

export function AppRouter() {
  const [router] = useState(createRouter);
  return <RouterProvider router={router} />;
}
