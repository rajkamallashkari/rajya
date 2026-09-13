require "rails_helper"

RSpec.describe Accounts::ListCommonGroups do
  it "returns only active groups shared by the viewer and target" do
    viewer = create(:user).account
    target = create(:account)
    shared = create_talk(kind: "group", owner: viewer, members: [ target ])
    private_group = create_talk(kind: "group", owner: viewer, members: [ create(:account) ])
    left = create_talk(kind: "group", owner: viewer, members: [ target ])
    left.conversation_memberships.find_by!(account: target).update!(status: "left")

    result = described_class.call(viewer:, account: target)

    expect(result.value.conversations).to contain_exactly(shared)
    expect(result.value.conversations).not_to include(private_group, left)
  end

  it "hides deactivated accounts and accounts blocking the viewer" do
    viewer = create(:user).account
    target = create(:account)
    create(:block, blocker_account: target, blocked_account: viewer)

    expect(described_class.call(viewer:, account: target)).to be_failure
    target.update!(deactivated_at: Time.current)
    expect(described_class.call(viewer:, account: target)).to be_failure
  end

  it "does not expose common groups for an account blocked by the viewer" do
    viewer = create(:user).account
    target = create(:account)
    create_talk(kind: "group", owner: viewer, members: [ target ])
    create(:block, blocker_account: viewer, blocked_account: target)

    expect(described_class.call(viewer:, account: target).value.conversations).to be_empty
  end
end
