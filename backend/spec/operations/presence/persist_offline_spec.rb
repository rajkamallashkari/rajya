require "rails_helper"

RSpec.describe Presence::PersistOffline do
  include ActiveSupport::Testing::TimeHelpers
  it "noops when the account is already back online (BR-44)" do
    user = create(:user)
    Presence::Counter.increment(user.account.id)
    allow(Presence::Announce).to receive(:call)

    described_class.call(account_id: user.account.id)

    expect(Presence::Announce).not_to have_received(:call)
  end

  it "persists last_active_at and announces offline when the counter is zero" do
    user = create(:user)
    allow(Presence::Announce).to receive(:call)
    freeze_time do
      described_class.call(account_id: user.account.id)

      expect(user.reload.last_active_at).to eq(Time.current)
      expect(Presence::Announce).to have_received(:call).with(account: user.account, online: false)
    end
  end

  it "succeeds when the account no longer exists" do
    expect(described_class.call(account_id: 0)).to be_success
  end
end
