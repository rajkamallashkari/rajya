require "rails_helper"

RSpec.describe SignalingChannel, type: :channel do
  let(:user) { create(:user) }

  before { stub_connection current_user: user, current_account: user.account }

  it "subscribes a human to their signaling stream" do
    subscribe

    expect(subscription).to be_confirmed
    expect(subscription).to have_stream_from(Realtime.signaling_stream(user.account.id))
  end

  it "rejects a bot" do
    bot = create(:bot)
    stub_connection current_user: user, current_account: bot.account
    subscribe

    expect(subscription).to be_rejected
  end
end
