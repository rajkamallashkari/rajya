import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppErrorBoundary, ListErrorBoundary, RouteErrorBoundary } from "./error-boundary";

let shouldThrow = true;

function Boom() {
  if (shouldThrow) {
    throw new Error("boom");
  }
  return <p>ok</p>;
}

describe("error boundaries", () => {
  it("renders children until a throw, then recovers", async () => {
    const user = userEvent.setup();
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    shouldThrow = true;
    render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    shouldThrow = false;
    await user.click(screen.getByRole("button"));
    expect(screen.getByText("ok")).toBeInTheDocument();
    spy.mockRestore();
  });

  it("uses route and list copy", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    shouldThrow = true;
    render(
      <RouteErrorBoundary>
        <Boom />
      </RouteErrorBoundary>,
    );
    expect(screen.getByText("This page could not be loaded")).toBeInTheDocument();
    render(
      <ListErrorBoundary>
        <Boom />
      </ListErrorBoundary>,
    );
    expect(screen.getByText("Could not load this list")).toBeInTheDocument();
    expect(screen.getAllByRole("alert")[1]).toHaveAttribute("data-error-level", "list");
    spy.mockRestore();
  });
});
