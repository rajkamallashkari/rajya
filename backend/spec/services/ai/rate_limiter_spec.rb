require "rails_helper"

RSpec.describe Ai::RateLimiter do
  let(:account) { create(:account) }

  it "allows bot replies up to the reply limit and then denies (F-12)" do
    stub_setting(:ai_reply_rate_limit, 1, category: "ai")

    expect(described_class.consume!(account: account, capability: :bot_reply)).to be(true)
    expect(described_class.consume!(account: account, capability: :bot_reply)).to be(false)
  end

  it "uses per-capability helper limits and tracks accounts independently (BR-84)" do
    stub_setting(:ai_rate_limit_rewrite, 1, category: "ai")
    other = create(:account)

    expect(described_class.consume!(account: account, capability: :rewrite)).to be(true)
    expect(described_class.consume!(account: other, capability: :rewrite)).to be(true)
    expect(described_class.consume!(account: account, capability: :rewrite)).to be(false)
    expect(described_class.limit_for(:translate)).to eq(20)
  end

  it "allows a missing account and writes a count when increment returns nothing" do
    expect(described_class.consume!(account: nil, capability: :bot_reply)).to be(true)
    allow(Rails.cache).to receive_messages(read: 0, increment: nil)
    allow(Rails.cache).to receive(:write)

    expect(described_class.consume!(account: account, capability: :summarize)).to be(true)
  end

  it "denies when increment races past the limit" do
    stub_setting(:ai_reply_rate_limit, 1, category: "ai")
    allow(Rails.cache).to receive_messages(read: 0, increment: 2)

    expect(described_class.consume!(account: account, capability: :bot_reply)).to be(false)
  end

  it "denies when the cache errors (BR-85 fail closed)" do
    allow(Rails.cache).to receive(:read).and_raise(RuntimeError)

    expect(described_class.consume!(account: account, capability: :bot_reply)).to be(false)
  end

  it "applies a style-profile limit change without a restart" do
    stub_setting(:ai_rate_limit_style_profile, 1, category: "ai")
    stub_setting(:ai_rate_limit_style_profile_period, 60, category: "ai")

    expect(described_class.limit_for(:style_profile)).to eq(1)
    expect(described_class.consume!(account: account, capability: :style_profile)).to be(true)
    expect(described_class.consume!(account: account, capability: :style_profile)).to be(false)
  end
end
