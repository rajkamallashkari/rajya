require "rails_helper"

RSpec.describe Messages::Unpin do
  it "removes the pin and keeps a deleted message listed until unpinned (BR-23)" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    Messages::Pin.call(message: message, actor: user.account)
    Messages::Unsend.call(message: message, actor: user.account)

    expect(conversation.pinned_messages.reload).to exist
    expect(described_class.call(message: message.reload, actor: user.account)).to be_success
    expect(conversation.pinned_messages.reload).not_to exist
    expect(conversation.messages.where(system_event: "message_unpinned")).to exist
  end

  it "returns not_found when the message is not pinned and forbids a stranger" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value

    expect(described_class.call(message: message, actor: user.account).error_code).to eq(:not_found)
    expect(described_class.call(message: message, actor: create(:user).account).error_code).to eq(:forbidden)
  end
end
