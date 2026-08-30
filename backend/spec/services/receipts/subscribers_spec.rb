require "rails_helper"

RSpec.describe Receipts::Subscribers do
  it "tracks account ids subscribed to a conversation" do
    described_class.add(1, 10)
    described_class.add(1, 11)
    expect(described_class.account_ids(1)).to contain_exactly(10, 11)

    described_class.remove(1, 10)
    expect(described_class.account_ids(1)).to eq([ 11 ])
  end

  it "fails closed when the cache raises" do
    allow(Rails.cache).to receive(:read).and_raise(Redis::BaseError, "down")
    expect(described_class.account_ids(1)).to eq([])
    expect(described_class.add(1, 2)).to eq({})
    expect(described_class.remove(1, 2)).to eq({})
  end
end
