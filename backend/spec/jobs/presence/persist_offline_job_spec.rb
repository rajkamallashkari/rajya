require "rails_helper"

RSpec.describe Presence::PersistOfflineJob do
  it "delegates to PersistOffline" do
    user = create(:user)
    allow(Presence::PersistOffline).to receive(:call).and_call_original

    described_class.perform_now(user.account.id)

    expect(Presence::PersistOffline).to have_received(:call).with(account_id: user.account.id)
    expect(user.reload.last_active_at).to be_present
  end
end
