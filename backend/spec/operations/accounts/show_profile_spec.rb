require "rails_helper"

RSpec.describe Accounts::ShowProfile do
  it "returns a visible account" do
    viewer = create(:account)
    target = create(:account)
    expect(described_class.call(viewer: viewer, account_id: target.id).value).to eq(target)
  end

  it "hides missing, deactivated, and blocked accounts (NR-1)" do
    viewer = create(:account)
    expect(described_class.call(viewer: viewer, account_id: 0).error_code).to eq(:not_found)

    gone = create(:account, :deactivated)
    expect(described_class.call(viewer: viewer, account_id: gone.id).error_code).to eq(:not_found)

    blocked = create(:account)
    create(:block, blocker_account: viewer, blocked_account: blocked)
    expect(described_class.call(viewer: viewer, account_id: blocked.id).error_code).to eq(:not_found)

    other = create(:account)
    create(:block, blocker_account: other, blocked_account: viewer)
    expect(described_class.call(viewer: viewer, account_id: other.id).error_code).to eq(:not_found)
  end
end
