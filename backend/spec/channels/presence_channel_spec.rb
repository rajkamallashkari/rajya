require "rails_helper"

RSpec.describe PresenceChannel, type: :channel do
  include ActiveJob::TestHelper

  let(:user) { create(:user) }
  let(:peer) { create(:user) }

  before { stub_connection current_user: user, current_account: user.account }

  it "subscribes a human to their presence stream" do
    subscribe

    expect(subscription).to be_confirmed
    expect(subscription).to have_stream_from(Realtime.presence_stream(user.account.id))
  end

  it "rejects a bot" do
    bot = create(:bot)
    stub_connection current_user: user, current_account: bot.account
    subscribe

    expect(subscription).to be_rejected
  end

  it "broadcasts online to a counterpart who may see last_active" do
    expect { subscribe }.to have_broadcasted_to(Realtime.presence_stream(peer.account.id))
      .with(hash_including(
              "type" => "presence",
              "online" => true,
              "account_id" => user.account.id
            ))
  end

  it "does not broadcast to an account whose counterpart disabled last_active" do
    create(:preference, account: user.account, data: { "privacy" => { "last_active" => false } })

    expect { subscribe }.not_to have_broadcasted_to(Realtime.presence_stream(peer.account.id))
  end

  it "does not broadcast to a blocked account" do
    create(:block, blocker_account: user.account, blocked_account: peer.account)

    expect { subscribe }.not_to have_broadcasted_to(Realtime.presence_stream(peer.account.id))
  end

  it "schedules offline persist when the last tab unsubscribes (BR-44)" do
    subscribe

    expect { unsubscribe }.to have_enqueued_job(Presence::PersistOfflineJob).with(user.account.id)
  end

  it "does not disconnect when subscribe was rejected" do
    bot = create(:bot)
    stub_connection current_user: user, current_account: bot.account
    allow(Presence::Disconnect).to receive(:call)
    subscribe
    described_class.new(connection, {}).unsubscribed

    expect(subscription).to be_rejected
    expect(Presence::Disconnect).not_to have_received(:call)
  end
end
