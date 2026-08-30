require "rails_helper"

RSpec.describe ScheduledMessage do
  it "rejects a create in the past and exposes due/pending scopes" do
    past = build(:scheduled_message, scheduled_at: 1.hour.ago)
    future = create(:scheduled_message, scheduled_at: 1.hour.from_now)

    expect(past).not_to be_valid
    expect(described_class.pending).to include(future)
    expect(described_class.due).not_to include(future)
  end
end
