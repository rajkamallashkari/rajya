require "rails_helper"

RSpec.describe Mentions::EveryoneLimiter do
  before { Rails.cache.clear }

  it "allows the first special mention and refuses the next within the window" do
    expect(described_class.consume!(conversation_id: 1, account_id: 2)).to be(true)
    expect(described_class.consume!(conversation_id: 1, account_id: 2)).to be(false)
  end

  it "tracks accounts independently" do
    expect(described_class.consume!(conversation_id: 1, account_id: 2)).to be(true)
    expect(described_class.consume!(conversation_id: 1, account_id: 3)).to be(true)
  end

  it "writes a count when cache increment returns nothing and refuses an over-limit increment" do
    allow(Rails.cache).to receive(:read).and_return(0)
    allow(Rails.cache).to receive(:increment).and_return(nil)
    allow(Rails.cache).to receive(:write)
    expect(described_class.consume!(conversation_id: 9, account_id: 9)).to be(true)

    allow(Rails.cache).to receive(:increment).and_return(2)
    expect(described_class.consume!(conversation_id: 8, account_id: 8)).to be(false)
  end
end
