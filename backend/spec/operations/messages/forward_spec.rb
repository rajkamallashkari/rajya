require "rails_helper"

RSpec.describe Messages::Forward do
  def setup
    user = create(:user)
    source = create_direct_between(user.account, create(:account))
    target = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(
      conversation: source, sender: user.account, body: "Fwd",
      attachment_signed_ids: [ blob_signed_id ]
    ).value
    [ user, message, target ]
  end

  it "copies into the target with the forwarder as sender and shares the blob (BR-10, BR-11, BR-13)" do
    user, message, target = setup
    copy = described_class.call(message: message, actor: user.account, target: target).value

    expect(copy).to have_attributes(
      conversation_id: target.id, sender_account_id: user.account.id, body: "Fwd",
      forwarded_from_account_id: user.account.id
    )
    expect(message.reload.forward_count).to eq(1)
    expect(copy.attachments.first.file.blob).to eq(message.attachments.first.file.blob)
  end

  it "does not touch copies when the original is unsent (BR-12) and rejects a deleted source" do
    user, message, target = setup
    copy = described_class.call(message: message, actor: user.account, target: target).value
    Messages::Unsend.call(message: message, actor: user.account)

    expect(copy.reload).not_to be_deleted
    expect(described_class.call(message: message.reload, actor: user.account, target: target).error_code)
      .to eq(:not_found)
  end

  it "copies attachment rows that have no blob (BR-11)" do
    user = create(:user)
    source = create_direct_between(user.account, create(:account))
    target = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: source, sender: user.account, body: "Fwd").value
    create(:attachment, message: message)
    copy = described_class.call(message: message, actor: user.account, target: target).value

    expect(copy.attachments.count).to eq(1)
    expect(copy.attachments.first.file).not_to be_attached
  end

  it "forbids forwarding into a channel the actor cannot post to" do
    user, message, _target = setup
    member = user
    channel = create_talk(kind: "channel", owner: create(:user).account, members: [ member.account ])

    expect(described_class.call(message: message, actor: member.account, target: channel).error_code)
      .to eq(:forbidden)
  end

  it "forbids a stranger and copies a message whose sender account is gone" do
    user, message, target = setup
    expect(described_class.call(message: message, actor: create(:user).account, target: target).error_code)
      .to eq(:forbidden)
    message.update_columns(sender_account_id: nil, sender_snapshot: { "display_name" => "Ghost" })
    copy = described_class.call(message: message.reload, actor: user.account, target: target).value
    expect(copy.forwarded_from_account_id).to be_nil
  end
end
