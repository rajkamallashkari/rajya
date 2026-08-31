require "rails_helper"

RSpec.describe Push::Subscriptions::Destroy do
  it "deletes the matching endpoint" do
    user = create(:user)
    row = create(:web_push_subscription, user: user)

    expect(described_class.call(user: user, endpoint: row.endpoint)).to be_success
    expect(WebPushSubscription.where(id: row.id)).not_to exist
  end

  it "rejects a blank endpoint, a miss, and a missing user" do
    user = create(:user)
    expect(described_class.call(user: nil, endpoint: "https://x").error_code).to eq(:forbidden)
    expect(described_class.call(user: user, endpoint: "").error_code).to eq(:validation_failed)
    expect(described_class.call(user: user, endpoint: "https://missing").error_code).to eq(:not_found)
  end
end
