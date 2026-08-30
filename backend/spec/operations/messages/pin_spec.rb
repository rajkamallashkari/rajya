require "rails_helper"

RSpec.describe Messages::Pin do
  def setup
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Pin me").value
    [ user, message ]
  end

  it "pins for any active member and is idempotent (BR-22)" do
    user, message = setup
    first = described_class.call(message: message, actor: user.account).value
    second = described_class.call(message: message, actor: user.account).value

    expect(first.id).to eq(second.id)
    expect(message.conversation.pinned_messages.count).to eq(1)
    expect(message.conversation.messages.where(system_event: "message_pinned").count).to eq(1)
  end

  it "rejects a pin past the configured cap and a deleted message (BR-21, BR-23)" do
    user, message = setup
    stub_setting(:pins_per_conversation, 1)
    described_class.call(message: message, actor: user.account)
    extra = Messages::Send.call(conversation: message.conversation, sender: user.account, body: "Two").value
    Messages::Unsend.call(message: extra, actor: user.account)

    expect(described_class.call(message: extra, actor: user.account).error_code).to eq(:not_found)
    live = Messages::Send.call(conversation: message.conversation, sender: user.account, body: "Three").value
    expect(described_class.call(message: live, actor: user.account).error_code).to eq(:validation_failed)
  end

  it "forbids a channel member from pinning" do
    member = create(:user)
    owner = create(:user)
    conversation = create_talk(kind: "channel", owner: owner.account, members: [ member.account ])
    message = Messages::Send.call(conversation: conversation, sender: owner.account, body: "Hi").value

    expect(described_class.call(message: message, actor: member.account).error_code).to eq(:forbidden)
  end

  it "forbids a group member when pin_messages is admin-only (NR-34)" do
    member = create(:user)
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ member.account ])
    conversation.update!(member_permissions: { "pin_messages" => "admin" })
    message = Messages::Send.call(conversation: conversation, sender: member.account, body: "Hi").value

    expect(described_class.call(message: message, actor: member.account).error_code).to eq(:forbidden)
  end
end
