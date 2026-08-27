import { useState } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import { RouteErrorBoundary } from "@/app/error-boundaries/error-boundary";
import { AppShell } from "@/app/shell";

function ShellRoute() {
  return (
    <RouteErrorBoundary>
      <AppShell />
    </RouteErrorBoundary>
  );
}

export function createRouter() {
  return createBrowserRouter([{ path: "/", element: <ShellRoute /> }]);
}

export function AppRouter() {
  const [router] = useState(createRouter);
  return <RouterProvider router={router} />;
}
