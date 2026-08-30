require "rails_helper"

RSpec.describe Messages::Unsend do
  def setup
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Bye").value
    [ user, message ]
  end

  it "tombstones the row, clears the body, and leaves children in place (BR-1, BR-7)" do
    user, message = setup
    create(:reaction, message: message, account: user.account)
    create(:saved_message, message: message, account: user.account)
    pin = create(:pinned_message, message: message, conversation: message.conversation, pinned_by_account: user.account)
    result = described_class.call(message: message, actor: user.account)

    expect(result.value).to be_deleted
    expect(result.value.body).to be_nil
    expect(message.reactions.reload).to exist
    expect(pin.reload).to be_persisted
  end

  it "rejects a second unsend, another member, and an expired unsend window" do
    user, message = setup
    peer = message.conversation.conversation_memberships.where.not(account: user.account).sole.account
    described_class.call(message: message, actor: user.account)
    other = Messages::Send.call(conversation: message.conversation, sender: user.account, body: "Two").value
    stub_setting(:unsend_window, 1)
    other.update_columns(created_at: 2.seconds.ago)

    expect(described_class.call(message: message.reload, actor: user.account).error_code).to eq(:conflict)
    expect(described_class.call(message: other, actor: peer).error_code).to eq(:forbidden)
    expect(described_class.call(message: other, actor: user.account).error_code).to eq(:forbidden)
  end
end
