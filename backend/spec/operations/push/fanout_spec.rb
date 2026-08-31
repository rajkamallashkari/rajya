require "rails_helper"

RSpec.describe Push::Fanout do
  def dm
    sender = create(:user)
    peer = create(:user)
    [ sender, peer, create_direct_between(sender.account, peer.account) ]
  end

  def send_from(user, conversation, **attrs)
    Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi", **attrs).value
  end

  def fanout(message, ids)
    described_class.call(
      event: :message_created,
      payload: { "message_id" => message.id },
      recipient_account_ids: ids
    )
  end

  def delivered(conversation, account)
    conversation.conversation_memberships.find_by!(account: account).last_delivered_position
  end

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

  it "advances delivered when muted without sending a visible push (Q-5)" do
    sender, peer, conversation = dm
    conversation.conversation_memberships.find_by!(account: peer.account).update!(muted_until: 1.day.from_now)
    message = send_from(sender, conversation)
    allow(Push::DeliveryChannel).to receive(:deliver)
    fanout(message, [ sender.account.id, peer.account.id ])

    expect(delivered(conversation, peer.account)).to eq(message.position)
    expect(Push::DeliveryChannel).not_to have_received(:deliver)
  end

  it "does not push a silent message and still advances delivered (NR-23)" do
    sender, peer, conversation = dm
    message = send_from(sender, conversation, silent: true)
    allow(Push::DeliveryChannel).to receive(:deliver)
    fanout(message, [ peer.account.id ])

    expect(delivered(conversation, peer.account)).to eq(message.position)
    expect(Push::DeliveryChannel).not_to have_received(:deliver)
  end

  it "does not push a channel post (BR-105) and still advances delivered" do
    owner = create(:user)
    member = create(:user)
    conversation = create_talk(kind: "channel", owner: owner.account, members: [ member.account ])
    message = send_from(owner, conversation)
    allow(Push::DeliveryChannel).to receive(:deliver)
    fanout(message, [ member.account.id ])

    expect(delivered(conversation, member.account)).to eq(message.position)
    expect(Push::DeliveryChannel).not_to have_received(:deliver)
  end

  it "advances delivered only when a visible push is accepted" do
    sender, peer, conversation = dm
    message = send_from(sender, conversation)
    allow(Push::DeliveryChannel).to receive(:deliver).and_return(true)
    fanout(message, [ peer.account.id ])

    expect(delivered(conversation, peer.account)).to eq(message.position)
    expect(Push::DeliveryChannel).to have_received(:deliver).with(
      account: peer.account, payload: hash_including("conversation_id" => conversation.id)
    )
  end

  it "does not advance delivered when a visible push is rejected" do
    sender, peer, conversation = dm
    message = send_from(sender, conversation)
    allow(Push::DeliveryChannel).to receive(:deliver).and_return(false)
    fanout(message, [ peer.account.id ])

    expect(delivered(conversation, peer.account)).to eq(0)
  end

  it "does not advance delivery for a non-message event" do
    sender, peer, conversation = dm
    message = create(:message, conversation: conversation, sender_account: sender.account, position: 1)
    described_class.call(
      event: :sidebar_update,
      payload: { "message_id" => message.id },
      recipient_account_ids: [ peer.account.id ]
    )

    expect(delivered(conversation, peer.account)).to eq(0)
  end

  it "skips a missing recipient account" do
    sender, _peer, conversation = dm
    message = send_from(sender, conversation)
    expect(fanout(message, [ 0 ])).to be_success
  end

  it "skips a bot recipient" do
    sender = create(:user)
    bot = create(:bot)
    conversation = create_direct_between(sender.account, bot.account)
    message = send_from(sender, conversation)
    allow(Push::DeliveryChannel).to receive(:deliver)
    fanout(message, [ bot.account.id ])

    expect(Push::DeliveryChannel).not_to have_received(:deliver)
  end

  it "still advances delivered when preference resolution fails" do
    sender, peer, conversation = dm
    create(:preference, account: peer.account, data: { "notifications" => { "global" => { "level" => "all", "foo" => 1 } } })
    message = send_from(sender, conversation)
    allow(Push::DeliveryChannel).to receive(:deliver)
    fanout(message, [ peer.account.id ])

    expect(delivered(conversation, peer.account.reload)).to eq(message.position)
    expect(Push::DeliveryChannel).not_to have_received(:deliver)
  end
end
