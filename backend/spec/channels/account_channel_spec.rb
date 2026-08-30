require "rails_helper"

RSpec.describe AccountChannel, type: :channel do
  let(:user) { create(:user) }

  before { stub_connection current_user: user, current_account: user.account }

  it "subscribes the connection's account to its own stream" do
    subscribe

    expect(subscription).to be_confirmed
    expect(subscription).to have_stream_from(Realtime.account_stream(user.account.id))
  end
end
