import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppProviders } from "./providers";
import { AppRouter, createRouter } from "./router";

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
});
