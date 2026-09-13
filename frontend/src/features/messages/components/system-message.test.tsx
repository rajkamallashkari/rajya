import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { en } from "@/shared/lib/i18n/catalog";
import { PermissionSystemMessage, SystemMessage, permissionMetadata } from "./system-message";

describe("system messages", () => {
  it("renders ordinary events as centered text", () => {
    render(
      <AppProviders>
        <SystemMessage eventKey="member_left" text="Grace left" />
      </AppProviders>,
    );

    expect(screen.getByText("Grace left")).toHaveAttribute("data-system-message", "member_left");
  });

  it("localizes ordinary events when backend text is absent", () => {
    render(
      <AppProviders>
        <SystemMessage eventKey="member_left" />
      </AppProviders>,
    );

    expect(screen.getByText(en.messages.system.member_left)).toBeInTheDocument();
  });

  it("renders deterministic permission changes as a labeled list", () => {
    const body =
      "Ada changed group permissions: Add members: Members → Admins; Send messages: Admins → Owner";
    render(
      <AppProviders>
        <PermissionSystemMessage
          body={body}
          metadata={{
            changes: [
              { new_value: "admin", permission: "add_members", previous_value: "member" },
              { new_value: "owner", permission: "send_messages", previous_value: "admin" },
            ],
            name: "Ada",
          }}
        />
      </AppProviders>,
    );

    const event = screen.getByLabelText(body);
    expect(event).toHaveAttribute("data-system-message", "permissions_changed");
    expect(within(event).getByText(en.conversations.permissions.add_members)).toBeInTheDocument();
    expect(within(event).getByText(en.conversations.permissions.send_messages)).toBeInTheDocument();
    expect(within(event).getAllByRole("listitem")).toHaveLength(2);
  });

  it("falls back to backend text for legacy permission payloads", () => {
    render(
      <AppProviders>
        <PermissionSystemMessage
          body="Group permissions updated"
          metadata={{ changes: [], name: "Ada" }}
        />
        <PermissionSystemMessage body="Legacy permission update" metadata={null} />
      </AppProviders>,
    );

    expect(screen.getByText("Group permissions updated")).toHaveAttribute(
      "data-system-message",
      "permissions_changed",
    );
    expect(screen.getByText("Legacy permission update")).toBeInTheDocument();
    expect(permissionMetadata(null)).toEqual({});
  });

  it("uses generic accessible copy when rich backend text is absent", () => {
    render(
      <AppProviders>
        <PermissionSystemMessage
          metadata={{
            changes: [
              { new_value: "admin", permission: "send_messages", previous_value: "member" },
            ],
            name: "Ada",
          }}
        />
      </AppProviders>,
    );

    expect(screen.getByLabelText(en.messages.system.permissions_changed)).toBeInTheDocument();
  });
});
