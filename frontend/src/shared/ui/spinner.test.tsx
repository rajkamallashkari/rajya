import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Spinner } from "./spinner";

describe("Spinner", () => {
  it("exposes a labeled status", () => {
    render(<Spinner label="Loading" />);
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });
});
