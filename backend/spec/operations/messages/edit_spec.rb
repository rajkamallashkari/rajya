require "rails_helper"

RSpec.describe Messages::Edit do
  def setup
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Old").value
    [ user, message ]
  end

  it "archives the previous body, stamps edited_at, and bumps revision only (BR-4, BR-34)" do
    user, message = setup
    result = described_class.call(message: message, editor: user.account, body: "New")

    expect(result.value).to have_attributes(body: "New", position: 1, revision: 2)
    expect(message.message_revisions.sole.body).to eq("Old")
    expect(result.value.edited_at).to be_present
  end

  it "rejects a blank body without attachments (BR-5, BR-6)" do
    user, message = setup
    expect(described_class.call(message: message, editor: user.account, body: "  ").error_code)
      .to eq(:validation_failed)
  end

  it "rejects another member and a bot-authored message (BR-3)" do
    user, message = setup
    peer = message.conversation.conversation_memberships.where.not(account: user.account).sole.account
    bot = create(:bot).account
    create(:conversation_membership, conversation: message.conversation, account: bot)
    bot_msg = Messages::Send.call(conversation: message.conversation, sender: bot, body: "Bot").value

    expect(described_class.call(message: message, editor: peer, body: "X").error_code).to eq(:forbidden)
    expect(described_class.call(message: bot_msg, editor: bot, body: "X").error_code).to eq(:forbidden)
  end

  it "rejects an edit after the configured window (BR-2)" do
    user, message = setup
    stub_setting(:message_edit_window, 1)
    message.update_columns(created_at: 2.seconds.ago)
    expect(described_class.call(message: message, editor: user.account, body: "New").error_code).to eq(:forbidden)
  end

  it "rejects a body longer than the configured maximum" do
    user, message = setup
    overlong = "x" * (Settings.fetch(:max_message_length) + 1)
    expect(described_class.call(message: message, editor: user.account, body: overlong).error_code)
      .to eq(:validation_failed)
  end

  it "allows clearing a caption when the message has attachments (BR-6)" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(
      conversation: conversation, sender: user.account, body: "cap",
      attachment_signed_ids: [ blob_signed_id ]
    ).value
    result = described_class.call(message: message, editor: user.account, body: "")

    expect(result).to be_success
    expect(result.value.body).to eq("")
  end

  it "rejects editing a tombstone" do
    user, message = setup
    Messages::Unsend.call(message: message, actor: user.account)
    expect(described_class.call(message: message.reload, editor: user.account, body: "New").error_code)
      .to eq(:forbidden)
  end

  it "rejects a message whose sender account is gone" do
    user, message = setup
    message.update_columns(sender_account_id: nil)
    allow(MessagePolicy).to receive(:new).and_return(instance_double(MessagePolicy, update?: true))
    expect(described_class.call(message: message, editor: user.account, body: "New").error_code)
      .to eq(:forbidden)
  end
end
