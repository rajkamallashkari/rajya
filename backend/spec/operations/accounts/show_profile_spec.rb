require "rails_helper"

RSpec.describe Accounts::ShowProfile do
  it "returns a visible account" do
    viewer = create(:account)
    target = create(:account)
    profile = described_class.call(viewer: viewer, account_id: target.id).value

    expect(profile.account).to eq(target)
    expect(profile.blocked_by_viewer).to be(false)
  end

  it "returns an account blocked by the viewer so they can unblock it" do
    viewer = create(:account)
    target = create(:account)
    create(:block, blocker_account: viewer, blocked_account: target)

    profile = described_class.call(viewer: viewer, account_id: target.id).value

    expect(profile.account).to eq(target)
    expect(profile.blocked_by_viewer).to be(true)
  end

  it "hides missing, deactivated, reverse-blocked, and mutually blocked accounts (NR-1)" do
    viewer = create(:account)
    expect(described_class.call(viewer: viewer, account_id: 0).error_code).to eq(:not_found)

    gone = create(:account, :deactivated)
    expect(described_class.call(viewer: viewer, account_id: gone.id).error_code).to eq(:not_found)

    other = create(:account)
    create(:block, blocker_account: other, blocked_account: viewer)
    expect(described_class.call(viewer: viewer, account_id: other.id).error_code).to eq(:not_found)

    mutual = create(:account)
    create(:block, blocker_account: viewer, blocked_account: mutual)
    create(:block, blocker_account: mutual, blocked_account: viewer)
    expect(described_class.call(viewer: viewer, account_id: mutual.id).error_code).to eq(:not_found)
  end
end
