import { fireEvent, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/ui")>();
  const Passthrough = ({ children }: { children: ReactNode }) => <>{children}</>;
  return {
    ...actual,
    ResponsiveOverlay: Passthrough,
    ResponsiveOverlayContent: Passthrough,
    ResponsiveOverlayTitle: Passthrough,
  };
});

import { ScheduledMessageEditor } from "./scheduled-message-editor";

describe("ScheduledMessageEditor", () => {
  it("ignores a stale submit after its message closes", () => {
    const onSave = vi.fn();
    const { container } = render(
      <ScheduledMessageEditor message={null} mode="edit" onOpenChange={vi.fn()} onSave={onSave} />,
    );

    fireEvent.submit(container.querySelector("form")!);
    expect(onSave).not.toHaveBeenCalled();
  });
});
