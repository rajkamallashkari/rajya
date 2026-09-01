require "rails_helper"

RSpec.describe ConversationMembership do
  it "is valid when last_seen_position is at least last_read_position" do
    expect(build(:conversation_membership, last_seen_position: 5, last_read_position: 5)).to be_valid
  end

  it "is invalid when last_seen_position is behind last_read_position" do
    membership = build(:conversation_membership, last_seen_position: 1, last_read_position: 5)

    expect(membership).not_to be_valid
    expect(membership.errors[:last_seen_position]).to include("must be greater than or equal to last_read_position")
  end

  it "skips the ordering check when either position is missing" do
    membership = build(:conversation_membership, last_seen_position: nil)

    expect(membership).not_to be_valid
    expect(membership.errors[:last_seen_position]).not_to include("must be greater than or equal to last_read_position")
  end

  it "rejects admin or owner roles on a bot (SCHEMA §3.1)" do
    membership = build(:conversation_membership, :admin, account: create(:bot).account)

    expect(membership).not_to be_valid
    expect(membership.errors[:role]).to include("bots cannot be admin or owner")
  end

  it "allows a bot as a member and skips the check without an account" do
    expect(build(:conversation_membership, account: create(:bot).account)).to be_valid
    orphan = build(:conversation_membership, :admin, account: nil)
    orphan.validate
    expect(orphan.errors[:role]).not_to include("bots cannot be admin or owner")
  end

  it "exposes role helpers (BR-48)" do
    owner = build(:conversation_membership, :owner)
    member = build(:conversation_membership)

    expect(owner).to be_owner
    expect(owner).to be_admin_or_owner
    expect(owner).to be_active
    expect(member).not_to be_admin_or_owner
  end

  it "scopes active, unarchived, and admin/owner rows" do
    conversation = create(:conversation)
    owner = create(:conversation_membership, :owner, conversation: conversation)
    left = create(:conversation_membership, :left, conversation: conversation, account: create(:account))
    archived = create(:conversation_membership, conversation: conversation, account: create(:account),
                                                archived_at: Time.current)

    expect(described_class.active).to contain_exactly(owner, archived)
    expect(described_class.archived).to contain_exactly(archived)
    expect(described_class.unarchived).to contain_exactly(owner, left)
    expect(described_class.admins_or_owners).to contain_exactly(owner)
  end
end
