import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ReportHost } from "./report-host";
import { AppProviders } from "@/app/providers";
import { resetFiledReports } from "@/shared/lib/api/msw/handlers";
import { en } from "@/shared/lib/i18n/catalog";

describe("ReportHost", () => {
  beforeEach(() => {
    resetFiledReports();
  });
  it("submits a report and closes the sheet", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    let open = true;
    const onOpenChange = (next: boolean) => {
      open = next;
    };
    const view = render(
      <AppProviders>
        <ReportHost onOpenChange={onOpenChange} open subjectId={2} subjectType="account" />
      </AppProviders>,
    );
    expect(await screen.findByRole("radio", { name: en.gallery.features.reason_spam })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.report.submit }));
    await waitFor(() => {
      expect(open).toBe(false);
    });
    view.rerender(
      <AppProviders>
        <ReportHost onOpenChange={onOpenChange} open={false} subjectId={2} subjectType="account" />
      </AppProviders>,
    );
  });
});
