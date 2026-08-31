require "rails_helper"

RSpec.describe Push::Subscriptions::Upsert do
  it "creates a subscription and updates keys for the same endpoint" do
    user = create(:user)
    created = described_class.call(
      user: user, endpoint: "https://push.example/a", p256dh: "k1", auth: "a1"
    )
    updated = described_class.call(
      user: user, endpoint: "https://push.example/a", p256dh: "k2", auth: "a2"
    )

    expect(created).to be_success
    expect(updated.value.id).to eq(created.value.id)
    expect(updated.value).to have_attributes(p256dh: "k2", auth: "a2")
  end

  it "rejects a blank payload or missing user" do
    user = create(:user)
    expect(described_class.call(user: nil, endpoint: "https://x", p256dh: "k", auth: "a").error_code)
      .to eq(:forbidden)
    expect(described_class.call(user: user, endpoint: "", p256dh: "k", auth: "a").error_code)
      .to eq(:validation_failed)
  end

  it "maps an invalid row to validation_failed" do
    user = create(:user)
    allow(WebPushSubscription).to receive(:find_or_initialize_by).and_return(
      WebPushSubscription.new(user: user)
    )
    expect(described_class.call(user: user, endpoint: "https://x", p256dh: "k", auth: "a").error_code)
      .to eq(:validation_failed)
  end
end
