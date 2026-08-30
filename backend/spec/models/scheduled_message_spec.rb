require "rails_helper"

RSpec.describe ScheduledMessage do
  it "rejects a create in the past and exposes due/pending scopes" do
    past = build(:scheduled_message, scheduled_at: 1.hour.ago)
    future = create(:scheduled_message, scheduled_at: 1.hour.from_now)

    expect(past).not_to be_valid
    expect(described_class.pending).to include(future)
    expect(described_class.due).not_to include(future)
  end

  it "treats a recurring row as due from next_run_at" do
    row = create(:scheduled_message, recurrence_rule: "FREQ=DAILY", next_run_at: 1.minute.ago,
                                     scheduled_at: 1.day.from_now)
    expect(described_class.due).to include(row)
    expect(row).to be_recurring
  end

  it "keeps a future recurring row in pending" do
    row = create(:scheduled_message, recurrence_rule: "FREQ=DAILY", next_run_at: 1.hour.from_now,
                                     scheduled_at: 1.day.from_now)
    expect(described_class.pending).to include(row)
    expect(described_class.due).not_to include(row)
  end

  it "rejects an unsupported recurrence rule" do
    row = build(:scheduled_message, recurrence_rule: "FREQ=HOURLY")
    expect(row).not_to be_valid
  end
end
