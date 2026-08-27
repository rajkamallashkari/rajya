import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

describe("Tabs", () => {
  it("switches panels", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <Tabs defaultValue="one">
        <TabsList>
          <TabsTrigger value="one">{"One"}</TabsTrigger>
          <TabsTrigger value="two">{"Two"}</TabsTrigger>
        </TabsList>
        <TabsContent value="one">{"First tab"}</TabsContent>
        <TabsContent value="two">{"Second tab"}</TabsContent>
      </Tabs>,
    );
    expect(screen.getByText("First tab")).toBeVisible();
    await user.click(screen.getByRole("tab", { name: "Two" }));
    expect(screen.getByText("Second tab")).toBeVisible();
  });
});
