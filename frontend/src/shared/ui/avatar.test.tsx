import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar, avatarTone, initialsFromName } from "./avatar";
import { AVATAR_TONES } from "./metrics";

describe("Avatar", () => {
  it("derives initials and a tone", () => {
    expect(initialsFromName("Ada Lovelace")).toBe("AL");
    expect(initialsFromName("Ada")).toBe("AD");
    expect(initialsFromName("   ")).toBe("");
    expect(AVATAR_TONES).toContain(avatarTone("Ada"));
  });

  it("renders image, named, unnamed and presence states", async () => {
    const { rerender } = render(
      <Avatar src="https://example.com/a.png" name="Ada Lovelace" presence="online" />,
    );
    expect(screen.getByLabelText("Ada Lovelace")).toBeInTheDocument();
    rerender(<Avatar name="Ada" presence="away" />);
    await waitFor(() => expect(screen.getByText("AD")).toBeInTheDocument());
    rerender(<Avatar presence="offline" />);
    expect(screen.getByLabelText("Avatar")).toBeInTheDocument();
    rerender(<Avatar name="Ada Lovelace" />);
    expect(document.querySelector("[data-presence]")).toBeNull();
  });
});
