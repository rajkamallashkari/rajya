require "rails_helper"

RSpec.describe Messages::Forward do
  include ActiveSupport::Testing::TimeHelpers
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

  it "forbids forwarding a message from a restricted conversation (NR-37)" do
    user, message, target = setup
    message.conversation.update!(restrict_forwarding: true)

    expect(described_class.call(message: message, actor: user.account, target: target).error_code)
      .to eq(:forbidden)
  end

  it "forbids forwarding media into a target that has send_media admin-only" do
    user, message, _target = setup
    group = create_talk(kind: "group", owner: create(:user).account, members: [ user.account ])
    group.update!(member_permissions: { "send_media" => "admin" })

    expect(described_class.call(message: message, actor: user.account, target: group).error_code)
      .to eq(:forbidden)
  end

  it "forbids forwarding text or a poll when those overrides are admin-only" do
    user = create(:user)
    source = create_direct_between(user.account, create(:account))
    text = Messages::Send.call(conversation: source, sender: user.account, body: "Hi").value
    poll = Messages::Send.call(
      conversation: source, sender: user.account, poll: { question: "Q?", options: [ "A", "B" ] }
    ).value
    group = create_talk(kind: "group", owner: create(:user).account, members: [ user.account ])
    group.update!(member_permissions: { "send_messages" => "admin", "create_polls" => "admin" })

    expect(described_class.call(message: text, actor: user.account, target: group).error_code)
      .to eq(:forbidden)
    expect(described_class.call(message: poll, actor: user.account, target: group).error_code)
      .to eq(:forbidden)
  end

  it "forwards a poll when create_polls is not narrowed" do
    user = create(:user)
    source = create_direct_between(user.account, create(:account))
    poll = Messages::Send.call(
      conversation: source, sender: user.account, poll: { question: "Q?", options: [ "A", "B" ] }
    ).value
    group = create_talk(kind: "group", owner: create(:user).account, members: [ user.account ])

    expect(described_class.call(message: poll, actor: user.account, target: group)).to be_success
  end

  it "forbids forwarding a voice note when send_media is admin-only" do
    user, message, _target = setup
    message.update_columns(kind: "voice", attachment_count: 0, body: nil)
    group = create_talk(kind: "group", owner: create(:user).account, members: [ user.account ])
    group.update!(member_permissions: { "send_media" => "admin" })

    expect(described_class.call(message: message, actor: user.account, target: group).error_code)
      .to eq(:forbidden)
  end

  it "rate-limits a forward into a slow-mode target (NR-36)" do
    freeze_time do
      user, message, _target = setup
      group = create_talk(kind: "group", owner: create(:user).account, members: [ user.account ])
      group.update!(slow_mode_seconds: 10)
      Messages::Send.call(conversation: group, sender: user.account, body: "First")

      expect(described_class.call(message: message, actor: user.account, target: group).error_code)
        .to eq(:rate_limited)
    end
  end
end
