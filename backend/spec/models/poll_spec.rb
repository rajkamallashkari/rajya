require "rails_helper"

RSpec.describe Poll do
  it "is closed when closed_at is set or closes_at has passed" do
    open_poll = build(:poll, closes_at: 1.hour.from_now)
    timed = build(:poll, closes_at: 1.minute.ago)
    shut = build(:poll, closed_at: Time.current)

    expect(open_poll).not_to be_closed
    expect(timed).to be_closed
    expect(shut).to be_closed
  end
end
