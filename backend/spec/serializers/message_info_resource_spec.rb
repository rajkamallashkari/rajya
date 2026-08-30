require "rails_helper"

RSpec.describe MessageInfoResource do
  it "snapshots delivered and read receipts from watermarks" do
    sender = create(:user)
    peer = create(:user)
    conversation = create_direct_between(sender.account, peer.account)
    message = create(:message, conversation: conversation, sender_account: sender.account, position: 1)
    membership = conversation.conversation_memberships.find_by!(account: peer.account)
    stamp = Time.utc(2026, 1, 2)
    membership.update!(last_delivered_position: 1, last_delivered_at: stamp)
    create(:receipt_mark, membership:, kind: "delivered", from_position: 0, position: 1, occurred_at: stamp)
    json = described_class.new(Messages::Watermarks.call(message: message)).to_h

    expect(json).to include("read" => [])
    expect(json.fetch("delivered").sole.fetch("account").fetch("id")).to eq(peer.account.id)
    expect(json.fetch("delivered").sole.fetch("at")).to be_present
  end
end
