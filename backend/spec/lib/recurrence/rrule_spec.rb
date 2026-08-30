require "rails_helper"

RSpec.describe Recurrence::Rrule do
  def parsed(rule)
    described_class.parse(rule)
  end

  it "parses FREQ, INTERVAL, and BYDAY" do
    expect(parsed("FREQ=DAILY;INTERVAL=2")).to have_attributes(freq: "DAILY", interval: 2)
    expect(parsed("RRULE:FREQ=WEEKLY;BYDAY=MO,WE")).to have_attributes(byday: [ 1, 3 ])
  end

  it "parses COUNT and compact UNTIL" do
    expect(parsed("FREQ=MONTHLY;COUNT=3").count).to eq(3)
    expect(parsed("FREQ=YEARLY;UNTIL=20261231T090000Z").until_at).to be_utc
  end

  it "rejects unsupported fields and COUNT plus UNTIL" do
    expect(parsed("FREQ=HOURLY")).to eq(:invalid)
    expect(parsed("COUNT=2")).to eq(:invalid)
    expect(parsed("FREQ=DAILY;INTERVAL=1.5")).to eq(:invalid)
    expect(parsed("FREQ=DAILY;COUNT=2;UNTIL=20261231T090000Z")).to eq(:invalid)
    expect(parsed("FREQ=DAILY;BYDAY=XX")).to eq(:invalid)
    expect(parsed("")).to be_nil
  end

  it "advances monthly and yearly stamps" do
    zone = ActiveSupport::TimeZone["UTC"]
    start = zone.local(2026, 1, 31, 9, 0, 0)
    month = described_class.next_after(parsed("FREQ=MONTHLY"), after: start.utc, zone: zone, dtstart: start.utc)
    year = described_class.next_after(parsed("FREQ=YEARLY"), after: start.utc, zone: zone, dtstart: start.utc)
    expect(month.in_time_zone(zone).month).to eq(2)
    expect(year.in_time_zone(zone).year).to eq(2027)
  end

  it "advances daily in the account timezone" do
    zone = ActiveSupport::TimeZone["Asia/Kolkata"]
    start = zone.local(2026, 8, 30, 9, 0, 0)
    nxt = described_class.next_after(parsed("FREQ=DAILY"), after: start.utc, zone: zone, dtstart: start.utc)

    expect(nxt.in_time_zone(zone)).to eq(zone.local(2026, 8, 31, 9, 0, 0))
  end

  it "parses ISO-8601 UNTIL and weekly BYDAY" do
    expect(parsed("FREQ=DAILY;UNTIL=2026-12-31T09:00:00Z").until_at).to be_utc
    zone = ActiveSupport::TimeZone["UTC"]
    start = zone.local(2026, 8, 30, 9, 0, 0)
    nxt = described_class.next_after(
      parsed("FREQ=WEEKLY;BYDAY=MO"), after: start.utc, zone: zone, dtstart: start.utc
    )
    expect(nxt.wday).to eq(1)
  end

  it "stops after COUNT occurrences" do
    rule = parsed("FREQ=DAILY;COUNT=1")
    expect(described_class.complete?(rule, occurrences_sent: 1, next_at: 1.day.from_now)).to be(true)
    expect(described_class.complete?(rule, occurrences_sent: 0, next_at: 1.day.from_now)).to be(false)
  end

  it "treats a missing next occurrence as complete" do
    rule = parsed("FREQ=DAILY;UNTIL=2020-01-01T00:00:00Z")
    expect(described_class.complete?(rule, occurrences_sent: 0, next_at: nil)).to be(true)
    expect(described_class.complete?(rule, occurrences_sent: 0, next_at: Time.utc(2021, 1, 1))).to be(true)
  end

  it "rejects a non-numeric INTERVAL or COUNT" do
    expect(parsed("FREQ=DAILY;INTERVAL=0")).to eq(:invalid)
    expect(parsed("FREQ=DAILY;COUNT=0")).to eq(:invalid)
    expect(parsed("FREQ=DAILY;COUNT=x")).to eq(:invalid)
    expect(parsed("FREQ=DAILY;UNTIL=not-a-time")).to eq(:invalid)
  end

  it "rejects duplicate keys and out-of-range INTERVAL or COUNT" do
    expect(parsed("FREQ=DAILY;FREQ=WEEKLY")).to eq(:invalid)
    stub_setting(:rrule_interval_max, 1)
    expect(parsed("FREQ=DAILY;INTERVAL=2")).to eq(:invalid)
    stub_setting(:rrule_count_max, 1)
    expect(parsed("FREQ=DAILY;COUNT=2")).to eq(:invalid)
  end

  it "advances weekly without BYDAY and returns nil past the lookahead" do
    zone = ActiveSupport::TimeZone["UTC"]
    start = zone.local(2026, 1, 1, 9, 0, 0)
    weekly = described_class.next_after(
      parsed("FREQ=WEEKLY"), after: start.utc, zone: zone, dtstart: start.utc
    )
    expect(weekly.in_time_zone(zone)).to eq(zone.local(2026, 1, 8, 9, 0, 0))
    expect(
      described_class.next_after(
        parsed("FREQ=DAILY"), after: start.utc + 500.days, zone: zone, dtstart: start.utc
      )
    ).to be_nil
  end
end
