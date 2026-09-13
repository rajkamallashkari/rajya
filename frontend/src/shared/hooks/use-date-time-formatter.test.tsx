import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  DateTimePreferencesProvider,
  useDateTimeFormatter,
} from "./use-date-time-formatter";

const STAMP = new Date(2026, 7, 27, 15, 4);

function Probe() {
  const format = useDateTimeFormatter();
  return (
    <>
      <span>{format.date(STAMP)}</span>
      <span>{format.time(STAMP)}</span>
      <span>{format.dateTime(STAMP)}</span>
      <span>{format.compact(STAMP, STAMP)}</span>
    </>
  );
}

describe("useDateTimeFormatter", () => {
  it("uses provided date and time preferences", () => {
    render(
      <DateTimePreferencesProvider value={{ dateFormat: "DD/MM/YYYY", timeFormat: "24h" }}>
        <Probe />
      </DateTimePreferencesProvider>,
    );
    expect(screen.getAllByText("27/08/2026")).toHaveLength(1);
    expect(screen.getAllByText("15:04")).toHaveLength(2);
    expect(screen.getByText("27/08/2026, 15:04")).toBeInTheDocument();
  });

  it("has registry-compatible defaults outside the provider", () => {
    render(<Probe />);
    expect(screen.getByText("Aug 27, 2026")).toBeInTheDocument();
    expect(screen.getAllByText(/03:04 PM/)).not.toHaveLength(0);
  });
});
