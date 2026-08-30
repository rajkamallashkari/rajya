require "rails_helper"

RSpec.describe Push::Fanout do
  it "returns the recipient list in one call (F-19)" do
    result = described_class.call(
      event: :message_created,
      payload: { "message_id" => 1 },
      recipient_account_ids: [ 2, 3 ]
    )

    expect(result).to be_success
    expect(result.value.fetch(:recipient_account_ids)).to eq([ 2, 3 ])
    expect(result.value.fetch(:event)).to eq("message_created")
  end

  it "advances delivered on acceptance even when the conversation is muted (Q-5)" do
    sender = create(:user)
    peer = create(:user)
    conversation = create_direct_between(sender.account, peer.account)
    conversation.conversation_memberships.find_by!(account: peer.account).update!(muted_until: 1.day.from_now)
    message = Messages::Send.call(conversation: conversation, sender: sender.account, body: "Hi").value
    described_class.call(
      event: :message_created,
      payload: { "message_id" => message.id },
      recipient_account_ids: [ sender.account.id, peer.account.id ]
    )
    membership = conversation.conversation_memberships.find_by!(account: peer.account)

    expect(membership.last_delivered_position).to eq(message.position)
  end

  it "does not advance delivery for a non-message event" do
    sender = create(:user)
    peer = create(:user)
    conversation = create_direct_between(sender.account, peer.account)
    message = create(:message, conversation: conversation, sender_account: sender.account, position: 1)
    described_class.call(
      event: :sidebar_update,
      payload: { "message_id" => message.id },
      recipient_account_ids: [ peer.account.id ]
    )
    membership = conversation.conversation_memberships.find_by!(account: peer.account)

    expect(membership.last_delivered_position).to eq(0)
  end

  it "skips a missing recipient account" do
    sender = create(:user)
    conversation = create_direct_between(sender.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: sender.account, body: "Hi").value
    expect(
      described_class.call(
        event: :message_created,
        payload: { message_id: message.id },
        recipient_account_ids: [ 0 ]
      )
    ).to be_success
  end
end
