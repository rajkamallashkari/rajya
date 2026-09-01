import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { AppProviders } from "./providers";
import { AppRouter, appRoutes, createRouter } from "./router";
import { en } from "@/shared/lib/i18n/catalog";

describe("AppRouter", () => {
  it("creates a data router and renders the shell", () => {
    expect(createRouter()).toBeTruthy();
    render(
      <AppProviders>
        <AppRouter />
      </AppProviders>,
    );
    expect(screen.getByText("Chat")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Gallery" })).toBeInTheDocument();
  });

  it("renders the public invite landing", async () => {
    const router = createMemoryRouter(appRoutes, { initialEntries: ["/invite/open"] });
    render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    );
    expect(await screen.findByRole("button", { name: en.invites.sign_in })).toBeInTheDocument();
  });

  it("renders the admin shell", async () => {
    const router = createMemoryRouter(appRoutes, { initialEntries: ["/admin"] });
    render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    );
    expect(await screen.findByText(en.admin.forbidden)).toBeInTheDocument();
  });
});
