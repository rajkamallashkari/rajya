require "rails_helper"

RSpec.describe Typing::Store do
  include ActiveSupport::Testing::TimeHelpers
  let(:conversation_id) { 1 }
  let(:account_id) { 2 }

  it "writes a TTL key and reports the activity" do
    described_class.write(conversation_id, account_id, "typing")

    expect(described_class.read(conversation_id, account_id)).to eq("typing")
  end

  it "uses typing_key_ttl as the cache expiry" do
    AppSetting.create!(key: "typing_key_ttl", value: 7, category: "realtime")
    allow(Rails.cache).to receive(:write).and_call_original

    described_class.write(conversation_id, account_id, "typing")

    expect(Rails.cache).to have_received(:write)
      .with("typing:#{conversation_id}:#{account_id}", "typing", hash_including(expires_in: 7.seconds))
  end

  it "expires the key without a cleanup job" do
    AppSetting.create!(key: "typing_key_ttl", value: 1, category: "realtime")
    described_class.write(conversation_id, account_id, "typing")
    travel 2.seconds

    expect(described_class.read(conversation_id, account_id)).to be_nil
    expect(Dir[Rails.root.join("app/jobs/**/*typing*")]).to be_empty
  end

  it "claims a broadcast once per throttle window" do
    AppSetting.create!(key: "typing_throttle", value: 30, category: "realtime")

    expect(described_class.claim_broadcast?(conversation_id, account_id)).to be(true)
    expect(described_class.claim_broadcast?(conversation_id, account_id)).to be(false)
  end

  it "returns nil from read/write when the cache raises" do
    allow(Rails.cache).to receive(:write).and_raise(Redis::BaseError, "down")
    allow(Rails.cache).to receive(:read).and_raise(Redis::BaseError, "down")

    expect(described_class.write(conversation_id, account_id, "typing")).to be_nil
    expect(described_class.read(conversation_id, account_id)).to be_nil
  end

  it "fails open on throttle when the cache raises" do
    allow(Rails.cache).to receive(:write).and_raise(Redis::BaseError, "down")

    expect(described_class.claim_broadcast?(conversation_id, account_id)).to be(true)
  end
end
