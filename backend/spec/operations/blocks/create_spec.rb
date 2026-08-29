require "rails_helper"

RSpec.describe Blocks::Create do
  it "creates a block" do
    blocker = create(:account)
    blocked = create(:account)
    result = described_class.call(blocker: blocker, blocked_id: blocked.id)

    expect(result).to be_success
    expect(result.value.blocked_account).to eq(blocked)
  end

  it "rejects missing, self, and duplicate blocks" do
    account = create(:account)
    expect(described_class.call(blocker: account, blocked_id: 0).error_code).to eq(:not_found)
    expect(described_class.call(blocker: account, blocked_id: account.id).error_code).to eq(:validation_failed)
    other = create(:account)
    create(:block, blocker_account: account, blocked_account: other)
    expect(described_class.call(blocker: account, blocked_id: other.id).error_code).to eq(:conflict)
  end
end
