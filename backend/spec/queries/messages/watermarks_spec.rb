require "rails_helper"

RSpec.describe Messages::Watermarks do
  def view!(account, conversation, position)
    Receipts::Advance.call(account: account, conversation: conversation, position: position, kind: "viewed")
  end

  it "lists recipients whose watermarks have crossed the message, omitting the sender" do
    sender = create(:user)
    peer = create(:user)
    conversation = create_direct_between(sender.account, peer.account)
    message = Messages::Send.call(conversation: conversation, sender: sender.account, body: "Hi").value
    view!(peer.account, conversation, message.position)
    result = described_class.call(message: message, viewer: sender.account)

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

  it "returns the same timestamp a per-message receipt row would have held (D-5)" do
    sender = create(:user)
    peer = create(:user)
    conversation = create_direct_between(sender.account, peer.account)
    first = Messages::Send.call(conversation: conversation, sender: sender.account, body: "A").value
    second = Messages::Send.call(conversation: conversation, sender: sender.account, body: "B").value
    freeze = Time.utc(2026, 8, 30, 12, 0, 0)
    allow(Time).to receive(:current).and_return(freeze)
    view!(peer.account, conversation, second.position)
    first_info = described_class.call(message: first, viewer: sender.account)
    second_info = described_class.call(message: second, viewer: sender.account)

    expect(first_info.read.sole.at).to be_within(1.second).of(freeze)
    expect(second_info.read.sole.at).to eq(first_info.read.sole.at)
  end

  it "hides the read list from a viewer with receipts off (BR-37)" do
    sender = create(:user)
    peer = create(:user)
    conversation = create_direct_between(sender.account, peer.account)
    message = Messages::Send.call(conversation: conversation, sender: sender.account, body: "Hi").value
    view!(peer.account, conversation, message.position)
    disable_receipts!(sender.account)

    expect(described_class.call(message: message, viewer: sender.account.reload).read).to eq([])
  end

  it "includes a bot row after consume so the info sheet stays coherent (S-9)" do
    sender = create(:user)
    bot = create(:bot)
    conversation = create_direct_between(sender.account, bot.account)
    message = Messages::Send.call(conversation: conversation, sender: sender.account, body: "Ping").value
    Receipts::Advance.call(
      account: bot.account, conversation: conversation, position: message.position, kind: "bot_consume"
    )
    result = described_class.call(message: message, viewer: sender.account)

    expect(result.read.sole.account.id).to eq(bot.account.id)
  end

  it "uses the membership timestamp when no covering delivered mark exists" do
    sender = create(:user)
    peer = create(:user)
    conversation = create_direct_between(sender.account, peer.account)
    message = create(:message, conversation: conversation, sender_account: sender.account, position: 1)
    conversation.conversation_memberships.find_by!(account: peer.account)
                .update!(last_delivered_position: 1, last_delivered_at: Time.utc(2026, 1, 2))
    result = described_class.call(message: message)

    expect(result.delivered.sole.at).to eq(Time.utc(2026, 1, 2))
  end

  it "omits a human reader who has receipts off even if a mark exists" do
    sender = create(:user)
    peer = create(:user)
    conversation = create_direct_between(sender.account, peer.account)
    message = Messages::Send.call(conversation: conversation, sender: sender.account, body: "Hi").value
    membership = conversation.conversation_memberships.find_by!(account: peer.account)
    create(:receipt_mark, membership: membership, kind: "read", from_position: 0, position: message.position)
    disable_receipts!(peer.account)
    result = described_class.call(message: message, viewer: sender.account)

    expect(result.read).to eq([])
  end

  context "when measuring N+1", :n_plus_one do
    let(:holder) { {} }

    populate do |count|
      sender = create(:user)
      members = Array.new(count) { create(:user).account }
      conversation = create_talk(kind: "group", owner: sender.account, members: members)
      message = Messages::Send.call(conversation: conversation, sender: sender.account, body: "Hi").value
      members.each { |account| view!(account, conversation, message.position) }
      holder[:message] = message
      holder[:viewer] = sender.account
    end

    it "does not grow queries as membership grows" do
      expect { described_class.call(message: holder.fetch(:message), viewer: holder.fetch(:viewer)) }
        .to perform_constant_number_of_queries
    end
  end
end
