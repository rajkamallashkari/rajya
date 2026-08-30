require "rails_helper"

RSpec.describe Receipts::Advance do
  def dm
    user = create(:user)
    peer = create(:user)
    [ user, peer, create_direct_between(user.account, peer.account) ]
  end

  def send_from(user, conversation, body)
    Messages::Send.call(conversation: conversation, sender: user.account, body: body).value
  end

  it "advances last_seen always and last_read only when receipts are on (BR-35, BR-36)" do
    user, peer, conversation = dm
    message = send_from(peer, conversation, "Hi")
    disable_receipts!(user.account)
    described_class.call(account: user.account, conversation: conversation, position: message.position, kind: "viewed")
    membership = conversation.conversation_memberships.find_by!(account: user.account)

    expect(membership.last_seen_position).to eq(message.position)
    expect(membership.last_read_position).to eq(0)
    expect(membership.receipt_marks.where(kind: "read")).to be_empty
  end

  it "does not retroactively disclose reads when receipts are enabled (BR-36)" do
    user, peer, conversation = dm
    hidden = send_from(peer, conversation, "Secret")
    disable_receipts!(user.account)
    described_class.call(account: user.account, conversation: conversation, position: hidden.position, kind: "viewed")
    user.account.preference.update!(data: { "privacy" => { "read_receipts" => true } })
    user.account.reload
    described_class.call(account: user.account, conversation: conversation, position: hidden.position, kind: "viewed")
    later = send_from(peer, conversation, "New")
    described_class.call(account: user.account, conversation: conversation, position: later.position, kind: "viewed")
    info = Messages::Watermarks.call(message: hidden, viewer: peer.account)

    expect(info.read.map(&:account)).to eq([])
    expect(Messages::Watermarks.call(message: later, viewer: peer.account).read.map(&:account)).to eq([ user.account ])
  end

  it "never moves a watermark backwards (BR-28)" do
    user, peer, conversation = dm
    first = send_from(peer, conversation, "A")
    second = send_from(peer, conversation, "B")
    described_class.call(account: user.account, conversation: conversation, position: second.position, kind: "viewed")
    described_class.call(account: user.account, conversation: conversation, position: first.position, kind: "viewed")
    membership = conversation.conversation_memberships.find_by!(account: user.account)

    expect(membership.last_seen_position).to eq(second.position)
    expect(membership.last_read_position).to eq(second.position)
  end

  it "advances delivered independently of viewing" do
    user, peer, conversation = dm
    message = send_from(peer, conversation, "Hi")
    described_class.call(account: user.account, conversation: conversation, position: message.position, kind: "delivered")
    membership = conversation.conversation_memberships.find_by!(account: user.account)

    expect(membership.last_delivered_position).to eq(message.position)
    expect(membership.last_read_position).to eq(0)
    expect(membership.receipt_marks.where(kind: "delivered")).to exist
  end

  it "advances a bot's watermarks on consume so the info sheet stays coherent (S-9)" do
    user = create(:user)
    bot = create(:bot)
    conversation = create_direct_between(user.account, bot.account)
    message = send_from(user, conversation, "Ping")
    result = described_class.call(
      account: bot.account, conversation: conversation, position: message.position, kind: "bot_consume"
    )
    membership = conversation.conversation_memberships.find_by!(account: bot.account)

    expect(result).to be_success
    expect(membership.last_read_position).to eq(message.position)
    expect(membership.last_delivered_position).to eq(message.position)
  end

  it "rejects a human bot_consume, a stranger, a bad kind, and a non-integer position" do
    user, _peer, conversation = dm

    expect(described_class.call(account: user.account, conversation: conversation, position: 1, kind: "bot_consume").error_code)
      .to eq(:forbidden)
    expect(described_class.call(account: create(:user).account, conversation: conversation, position: 1, kind: "viewed").error_code)
      .to eq(:forbidden)
    expect(described_class.call(account: user.account, conversation: conversation, position: 1, kind: "nope").error_code)
      .to eq(:validation_failed)
    expect(described_class.call(account: user.account, conversation: conversation, position: "x", kind: "viewed").error_code)
      .to eq(:validation_failed)
  end

  it "returns not_found when show is allowed but membership is missing" do
    conversation = create_direct_between(create(:account), create(:account))
    stranger = create(:user).account
    allow(ConversationPolicy).to receive(:new).and_return(instance_double(ConversationPolicy, show?: true))
    expect(described_class.call(account: stranger, conversation: conversation, position: 1, kind: "viewed").error_code)
      .to eq(:not_found)
  end

  it "is a no-op when the conversation has no messages" do
    user, _peer, conversation = dm
    expect(described_class.call(account: user.account, conversation: conversation, position: 9, kind: "viewed")).to be_success
    expect(conversation.conversation_memberships.find_by!(account: user.account).last_seen_position).to eq(0)
  end

  it "does not broadcast a read receipt when receipts are off" do
    user, peer, conversation = dm
    message = send_from(peer, conversation, "Hi")
    disable_receipts!(user.account)
    described_class.call(account: user.account, conversation: conversation, position: message.position, kind: "viewed")
    kinds = []
    allow(ActionCable.server).to receive(:broadcast) do |_stream, payload|
      kinds << payload["kind"] if payload["type"] == "receipts_updated"
    end
    described_class.call(account: user.account, conversation: conversation, position: message.position, kind: "viewed")
    expect(kinds).not_to include("read")
  end
end
