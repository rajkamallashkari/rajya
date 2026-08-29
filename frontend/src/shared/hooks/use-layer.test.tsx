import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { useLayer } from "./use-layer";
import { Button } from "@/shared/ui/button";
import { layerStackDepth } from "@/shared/lib/navigation/layer-stack";

function Probe() {
  const [open, setOpen] = useState(true);
  const { close } = useLayer("probe", open, setOpen);
  if (!open) {
    return <p>{"closed"}</p>;
  }
  return (
    <Button onClick={close} type="button">
      {"hide"}
    </Button>
  );
}

describe("useLayer", () => {
  it("registers while open and unregisters on close", async () => {
    const user = userEvent.setup();
    render(<Probe />);
    await Promise.resolve();
    expect(layerStackDepth()).toBe(1);
    await user.click(screen.getByRole("button", { name: "hide" }));
    expect(screen.getByText("closed")).toBeInTheDocument();
    await Promise.resolve();
    expect(layerStackDepth()).toBe(0);
  });

  it("does not register when closed", () => {
    function Closed() {
      useLayer("closed", false, vi.fn());
      return <p>{"idle"}</p>;
    }
    render(<Closed />);
    expect(layerStackDepth()).toBe(0);
  });
});
