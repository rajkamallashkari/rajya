require "rails_helper"

RSpec.describe Presence::Counter do
  let(:account_id) { create(:account).id }

  it "increments and reports online" do
    expect(described_class.increment(account_id)).to eq(1)
    expect(described_class).to be_online(account_id)
    expect(described_class.increment(account_id)).to eq(2)
  end

  it "decrements with a floor of zero" do
    described_class.increment(account_id)
    described_class.increment(account_id)
    expect(described_class.decrement(account_id)).to eq(1)
    expect(described_class.decrement(account_id)).to eq(0)
    expect(described_class.decrement(account_id)).to eq(0)
  end

  it "uses presence_ttl as the cache expiry" do
    AppSetting.create!(key: "presence_ttl", value: 15, category: "realtime")
    allow(Rails.cache).to receive(:increment).and_call_original

    described_class.increment(account_id)

    expect(Rails.cache).to have_received(:increment)
      .with("presence:account:#{account_id}", 1, hash_including(expires_in: 15.seconds))
  end

  it "writes through when increment returns nil" do
    allow(Rails.cache).to receive(:increment).and_return(nil)

    expect(described_class.increment(account_id)).to eq(1)
    expect(described_class.read(account_id)).to eq(1)
  end

  it "clamps a nil increment on decrement to zero" do
    allow(Rails.cache).to receive(:increment).and_return(nil)

    expect(described_class.decrement(account_id)).to eq(0)
  end

  it "returns 0 when the cache raises" do
    allow(Rails.cache).to receive(:increment).and_raise(Redis::BaseError, "down")

    expect(described_class.increment(account_id)).to eq(0)
  end
end
