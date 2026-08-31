require "rails_helper"

RSpec.describe WebPushSubscription do
  it "is unique per user and endpoint" do
    user = create(:user)
    create(:web_push_subscription, user: user, endpoint: "https://push.example/one")
    dup = build(:web_push_subscription, user: user, endpoint: "https://push.example/one")
    expect(dup).not_to be_valid
    expect(build(:web_push_subscription, user: user, endpoint: "https://push.example/two")).to be_valid
  end
end
