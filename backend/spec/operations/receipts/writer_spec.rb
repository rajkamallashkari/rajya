require "rails_helper"

RSpec.describe Receipts::Writer do
  it "ignores a duplicate receipt_mark insert" do
    membership = create(:conversation_membership)
    described_class.deliver!(membership, 1)
    expect do
      described_class.insert_mark!(
        membership.reload, kind: "delivered", from_position: 0, position: 1, occurred_at: Time.current
      )
    end.not_to raise_error
  end

  it "counts a system message as unread for every member (BR-40)" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    create(
      :message, conversation: conversation, sender_account: nil, kind: "system",
      system_event: "member_added", position: 1, body: nil
    )
    membership = conversation.conversation_memberships.find_by!(account: user.account)
    described_class.refresh_unread!(membership)

    expect(membership.reload.unread_count).to eq(1)
  end
end
