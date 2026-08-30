require "rails_helper"

RSpec.describe Messages::Watermarks do
  def mark_read!(conversation, account)
    conversation.conversation_memberships.find_by!(account: account).update!(
      last_delivered_position: 1, last_delivered_at: Time.current,
      last_read_position: 1, last_read_at: Time.current, last_seen_position: 1
    )
  end
  it "lists recipients whose watermarks have crossed the message, omitting the sender" do
    sender = create(:user)
    peer = create(:user)
    conversation = create_direct_between(sender.account, peer.account)
    message = create(:message, conversation: conversation, sender_account: sender.account, position: 1)
    mark_read!(conversation, peer.account)
    result = described_class.call(message: message)

    expect(result.delivered.map { |row| row.account.id }).to eq([ peer.account.id ])
    expect(result.read.sole.account.id).to eq(peer.account.id)
    expect(result.delivered.first.at).to be_present
  end

  it "omits a recipient whose watermark has not reached the message" do
    sender = create(:user)
    peer = create(:user)
    conversation = create_direct_between(sender.account, peer.account)
    message = create(:message, conversation: conversation, sender_account: sender.account, position: 2)
    result = described_class.call(message: message)

    expect(result.delivered).to eq([])
    expect(result.read).to eq([])
  end
end
