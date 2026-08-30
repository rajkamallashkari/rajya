require "rails_helper"

RSpec.describe Receipts::ReconcileUnreads do
  it "repairs a drifted unread_count from last_seen (BR-40)" do
    user = create(:user)
    peer = create(:user)
    conversation = create_direct_between(user.account, peer.account)
    Messages::Send.call(conversation: conversation, sender: peer.account, body: "A")
    Messages::Send.call(conversation: conversation, sender: peer.account, body: "B")
    membership = conversation.conversation_memberships.find_by!(account: user.account)
    membership.update_columns(unread_count: 99, last_seen_position: 0)

    described_class.call(membership: membership)
    expect(membership.reload.unread_count).to eq(2)
  end

  it "walks every membership when no target is given" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    conversation.conversation_memberships.find_by!(account: user.account).update_columns(unread_count: 7)
    described_class.call
    expect(conversation.conversation_memberships.find_by!(account: user.account).unread_count).to eq(0)
  end
end
