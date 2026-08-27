import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders every variant", () => {
    const { rerender } = render(<Badge>{"n"}</Badge>);
    expect(screen.getByText("n")).toBeInTheDocument();
    rerender(<Badge variant="muted">{"m"}</Badge>);
    rerender(<Badge variant="success">{"s"}</Badge>);
    rerender(<Badge variant="warning">{"w"}</Badge>);
    rerender(<Badge variant="danger">{"d"}</Badge>);
    rerender(<Badge variant="accent">{"a"}</Badge>);
    expect(screen.getByText("a")).toBeInTheDocument();
  });
});
