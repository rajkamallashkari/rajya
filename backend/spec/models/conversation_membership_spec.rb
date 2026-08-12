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
end
