require "rails_helper"

RSpec.describe Presence::RecordLastActive do
  include ActiveSupport::Testing::TimeHelpers
  it "writes last_active_at on the first call within the debounce window" do
    user = create(:user)
    freeze_time do
      described_class.call(account_id: user.account.id)
      expect(user.reload.last_active_at).to eq(Time.current)
    end
  end

  it "skips a second write until last_active_debounce expires" do
    user = create(:user)
    described_class.call(account_id: user.account.id)
    first = user.reload.last_active_at
    travel 1.second
    described_class.call(account_id: user.account.id)

    expect(user.reload.last_active_at).to eq(first)
  end

  it "uses last_active_debounce as the write lock TTL" do
    user = create(:user)
    AppSetting.create!(key: "last_active_debounce", value: 2, category: "realtime")
    allow(Rails.cache).to receive(:write).and_call_original

    described_class.call(account_id: user.account.id)

    expect(Rails.cache).to have_received(:write).with(
      "last_active_write:#{user.account.id}",
      true,
      hash_including(expires_in: 2.seconds, unless_exist: true)
    )
  end

  it "writes again when force is true" do
    user = create(:user)
    described_class.call(account_id: user.account.id)
    travel 1.second
    described_class.call(account_id: user.account.id, force: true)

    expect(user.reload.last_active_at).to be_within(1.second).of(Time.current)
  end

  it "succeeds when the account or user is missing" do
    expect(described_class.call(account_id: 0)).to be_success
    expect(described_class.call(account_id: create(:account).id)).to be_success
  end
end
