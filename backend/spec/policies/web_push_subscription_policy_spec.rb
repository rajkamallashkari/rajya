require "rails_helper"

RSpec.describe WebPushSubscriptionPolicy do
  it "allows a human to read vapid, create, and destroy" do
    user = create(:user)
    policy = described_class.new(user.account, WebPushSubscription)
    expect(policy).to be_vapid.and be_create.and be_destroy
  end

  it "denies a bot and a missing account" do
    bot = create(:bot)
    expect(described_class.new(bot.account, WebPushSubscription)).not_to be_create
    expect(described_class.new(nil, WebPushSubscription)).not_to be_vapid
  end

  it "scopes subscriptions to the account's user" do
    user = create(:user)
    own = create(:web_push_subscription, user: user)
    create(:web_push_subscription)
    expect(described_class::Scope.new(user.account, WebPushSubscription.all).resolve).to contain_exactly(own)
    expect(described_class::Scope.new(nil, WebPushSubscription.all).resolve).to be_empty
  end
end
