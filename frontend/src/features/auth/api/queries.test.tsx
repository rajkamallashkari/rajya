import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { persistSession } from "@/features/auth/model/persist-session";
import { setAccessSession } from "@/features/auth/model/access-session";
import { testSession } from "@/test/access-session";
import { Button } from "@/shared/ui/button";
import { useMe, useUpdateProfile } from "./queries";

function Harness() {
  const me = useMe();
  const update = useUpdateProfile();
  return (
    <div>
      <p data-name="">{me.data?.account.display_name ?? ""}</p>
      <Button
        onClick={() => update.mutate({ display_name: "Ada Lovelace", username: "ada", bio: "Hi" })}
        type="button"
      >
        save
      </Button>
    </div>
  );
}

describe("auth profile queries", () => {
  it("loads me and persists a profile patch onto the active account", async () => {
    const user = userEvent.setup();
    setAccessSession(testSession());
    persistSession({
      account: { display_name: "Ada", id: 1, username: "ada" },
      token: "tok",
      user: { has_passkey: true, has_password: true, onboarded: true },
    });
    render(
      <AppProviders>
        <Harness />
      </AppProviders>,
    );
    expect(await screen.findByText("Ada")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "save" }));
    await waitFor(() => {
      expect(useAccountsStore.getState().accounts[0]?.displayName).toBe("Ada Lovelace");
    });
  });
});
