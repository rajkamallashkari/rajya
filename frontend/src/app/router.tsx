import { useState } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import { GalleryPage } from "@/app/dev/gallery-page";
import { RouteErrorBoundary } from "@/app/error-boundaries/error-boundary";
import { AppShell } from "@/app/shell";

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

export const appRoutes = [
  { path: "/", element: <ShellRoute /> },
  { path: "/dev/gallery", element: <GalleryRoute /> },
];

export function createRouter() {
  return createBrowserRouter(appRoutes);
}

export function AppRouter() {
  const [router] = useState(createRouter);
  return <RouterProvider router={router} />;
}
