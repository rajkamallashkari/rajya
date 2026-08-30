require "rails_helper"

RSpec.describe Receipts::OnSend do
  it "marks the chat read for the sender and increments the peer unread (BR-27, BR-40)" do
    user = create(:user)
    peer = create(:user)
    conversation = create_direct_between(user.account, peer.account)
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    sender = conversation.conversation_memberships.find_by!(account: user.account)
    other = conversation.conversation_memberships.find_by!(account: peer.account)

    expect(sender.unread_count).to eq(0)
    expect(sender.last_read_position).to eq(message.position)
    expect(other.unread_count).to eq(1)
  end

  it "skips the sender write when membership is missing" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    allow(Conversations::View).to receive(:membership_for).and_return(nil)
    expect(described_class.call(conversation: conversation, sender: user.account, position: 1)).to be_success
  end
end
