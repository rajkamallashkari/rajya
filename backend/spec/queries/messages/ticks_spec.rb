require "rails_helper"

RSpec.describe Messages::Ticks do
  def tick(message, viewer)
    described_class.call(message: message, viewer: viewer)
  end

  def view!(account, conversation, position)
    Receipts::Advance.call(account: account, conversation: conversation, position: position, kind: "viewed")
  end

  def deliver!(account, conversation, position)
    Receipts::Advance.call(account: account, conversation: conversation, position: position, kind: "delivered")
  end

  describe "DM" do
    let(:sender) { create(:user) }
    let(:peer) { create(:user) }
    let(:conversation) { create_direct_between(sender.account, peer.account) }
    let(:message) { Messages::Send.call(conversation: conversation, sender: sender.account, body: "Hi").value }

    it "is sent on server acknowledgement (NR-2, changes BR-29)" do
      expect(tick(message, sender.account)).to eq("sent")
    end

    it "is delivered when the peer's device has the message (NR-2, Q-5)" do
      deliver!(peer.account, conversation, message.position)
      expect(tick(message.reload, sender.account)).to eq("delivered")
    end

    it "is read when the peer viewed with receipts on (NR-2)" do
      view!(peer.account, conversation, message.position)
      expect(tick(message.reload, sender.account)).to eq("read")
    end
  end

  describe "group" do
    let(:sender) { create(:user) }
    let(:alice) { create(:user) }
    let(:bob) { create(:user) }
    let(:conversation) do
      create_talk(kind: "group", owner: sender.account, members: [ alice.account, bob.account ])
    end
    let(:message) { Messages::Send.call(conversation: conversation, sender: sender.account, body: "Hi").value }

    it "stays delivered until every active human recipient has been delivered" do
      deliver!(alice.account, conversation, message.position)
      expect(tick(message.reload, sender.account)).to eq("sent")
      deliver!(bob.account, conversation, message.position)
      expect(tick(message.reload, sender.account)).to eq("delivered")
    end

    it "stays delivered until every active human recipient has read (changes BR-39)" do
      view!(alice.account, conversation, message.position)
      deliver!(bob.account, conversation, message.position)
      expect(tick(message.reload, sender.account)).to eq("delivered")
      view!(bob.account, conversation, message.position)
      expect(tick(message.reload, sender.account)).to eq("read")
    end

    it "ignores a bot member so the group is not stalled (S-9, changes BR-41)" do
      bot = create(:bot)
      group = create_talk(kind: "group", owner: sender.account, members: [ alice.account, bot.account ])
      prompt = Messages::Send.call(conversation: group, sender: sender.account, body: "Hi").value
      view!(alice.account, group, prompt.position)

      expect(tick(prompt.reload, sender.account)).to eq("read")
    end
  end

  describe "bot conversation (S-9)" do
    let(:sender) { create(:user) }
    let(:bot) { create(:bot) }
    let(:conversation) { create_direct_between(sender.account, bot.account) }
    let(:message) { Messages::Send.call(conversation: conversation, sender: sender.account, body: "Ping").value }

    it "stays at one tick until the bot consumes the prompt" do
      expect(tick(message, sender.account)).to eq("sent")
    end

    it "reaches accent ticks once the bot has read the prompt" do
      Receipts::Advance.call(
        account: bot.account, conversation: conversation, position: message.position, kind: "bot_consume"
      )
      expect(tick(message.reload, sender.account)).to eq("read")
    end

    it "still shows accent ticks when the human has receipts off (S-9)" do
      disable_receipts!(sender.account)
      Receipts::Advance.call(
        account: bot.account, conversation: conversation, position: message.position, kind: "bot_consume"
      )
      expect(tick(message.reload, sender.account.reload)).to eq("read")
    end
  end

  it "is sent when the sender is the only member" do
    account = create(:account)
    conversation = create_direct_between(account)
    message = create(:message, conversation: conversation, sender_account: account, position: 1)

    expect(tick(message, account)).to eq("sent")
  end

  it "does not show accent ticks when the sender has receipts off (BR-37)" do
    sender = create(:user)
    peer = create(:user)
    conversation = create_direct_between(sender.account, peer.account)
    message = Messages::Send.call(conversation: conversation, sender: sender.account, body: "Hi").value
    disable_receipts!(sender.account)
    view!(peer.account, conversation, message.position)

    expect(tick(message.reload, sender.account)).to eq("delivered")
  end

  it "omits ticks on incoming messages" do
    sender = create(:user)
    peer = create(:user)
    conversation = create_direct_between(sender.account, peer.account)
    message = Messages::Send.call(conversation: conversation, sender: sender.account, body: "Hi").value

    expect(tick(message, peer.account)).to be_nil
  end
end
