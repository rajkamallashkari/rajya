require "rails_helper"

RSpec.describe Presence::Connect do
  include ActiveJob::TestHelper

  it "announces online on the first connection and records last_active" do
    user = create(:user)
    allow(Presence::Announce).to receive(:call)

    expect { described_class.call(account: user.account) }
      .to have_enqueued_job(Presence::RecordLastActiveJob).with(user.account.id)
    expect(Presence::Announce).to have_received(:call).with(account: user.account, online: true)
  end

  it "does not re-announce when a second tab increments the counter" do
    user = create(:user)
    described_class.call(account: user.account)
    allow(Presence::Announce).to receive(:call)

    described_class.call(account: user.account)

    expect(Presence::Announce).not_to have_received(:call)
  end

  it "rejects a bot account" do
    expect(described_class.call(account: create(:bot).account).error_code).to eq(:forbidden)
  end
end
