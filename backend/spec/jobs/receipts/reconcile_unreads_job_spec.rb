require "rails_helper"

RSpec.describe Receipts::ReconcileUnreadsJob do
  it "delegates to the operation for one membership and for all" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    membership = conversation.conversation_memberships.find_by!(account: user.account)
    membership.update_columns(unread_count: 4)
    described_class.perform_now(membership.id)
    expect(membership.reload.unread_count).to eq(0)

    other = create(:conversation_membership, unread_count: 3)
    described_class.perform_now
    expect(other.reload.unread_count).to eq(0)
  end
end
