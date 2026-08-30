require "rails_helper"

RSpec.describe StorageQuota do
  it "creates a default row and answers whether an upload fits" do
    account = create(:account)
    quota = described_class.ensure_for!(account)

    expect(quota.quota_bytes).to eq(Settings.fetch(:user_quota_bytes))
    expect(quota.can_upload?(quota.quota_bytes)).to be(true)
    expect(quota.can_upload?(quota.quota_bytes + 1)).to be(false)
    expect(described_class.ensure_for!(account).account_id).to eq(account.id)
  end
end
