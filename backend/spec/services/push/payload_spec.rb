require "rails_helper"

RSpec.describe Push::Payload do
  it "uses the sender name for a DM and hides the body when preview is off" do
    sender = create(:user)
    peer = create(:user)
    conversation = create_direct_between(sender.account, peer.account)
    message = Messages::Send.call(conversation: conversation, sender: sender.account, body: "Secret").value
    payload = described_class.for_message(
      account: peer.account, message: message, settings: { "show_preview" => false }
    )

    expect(payload.fetch("title")).to eq(sender.account.display_name)
    expect(payload.fetch("body")).to eq(Catalog.t("push.preview_hidden"))
    expect(payload.fetch("url")).to include("/c/#{conversation.id}")
  end

  it "uses the conversation title for a group and the message body when preview is on" do
    owner = create(:user)
    member = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ member.account ])
    conversation.update!(title: "Crew")
    message = Messages::Send.call(conversation: conversation, sender: owner.account, body: "Hello").value
    payload = described_class.for_message(
      account: member.account, message: message, settings: { "show_preview" => true }
    )

    expect(payload.fetch("title")).to eq("Crew")
    expect(payload.fetch("body")).to eq("Hello")
  end

  it "falls back to the sender name when a group has no title" do
    owner = create(:user)
    member = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ member.account ])
    conversation.update_columns(title: "")
    message = Messages::Send.call(conversation: conversation, sender: owner.account, body: "Hello").value
    payload = described_class.for_message(
      account: member.account, message: message, settings: { "show_preview" => true }
    )

    expect(payload.fetch("title")).to eq(owner.account.display_name)
  end

  it "falls back to the sender account when the snapshot has no display name" do
    sender = create(:user)
    peer = create(:user)
    conversation = create_direct_between(sender.account, peer.account)
    message = Messages::Send.call(conversation: conversation, sender: sender.account, body: "Hi").value
    message.update_columns(sender_snapshot: { "username" => "x" }, body: "")
    from_hash = described_class.for_message(account: peer.account, message: message.reload, settings: {})
    message.update_columns(sender_snapshot: [])
    from_list = described_class.for_message(account: peer.account, message: message.reload, settings: {})

    expect(from_hash.fetch("title")).to eq(sender.account.display_name)
    expect(from_list.fetch("title")).to eq(sender.account.display_name)
    expect(from_hash.fetch("body")).to eq(Catalog.t("push.preview_hidden"))
  end

  it "uses a blank title when the sender account is gone" do
    sender = create(:user)
    peer = create(:user)
    conversation = create_direct_between(sender.account, peer.account)
    message = Messages::Send.call(conversation: conversation, sender: sender.account, body: "Hi").value
    message.update_columns(sender_snapshot: [], sender_account_id: nil)
    payload = described_class.for_message(account: peer.account, message: message.reload, settings: {})

    expect(payload.fetch("title")).to eq("")
  end

  it "builds a reminder payload from the note or the message" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Ping").value
    row = MessageReminders::Create.call(account: user.account, message: message, remind_at: 1.hour.from_now, note: "Go").value
    payload = described_class.for_reminder(reminder: row)

    expect(payload.fetch("title")).to eq(Catalog.t("push.reminder.title"))
    expect(payload.fetch("body")).to eq("Go")
    expect(payload.fetch("url")).to include("/m/#{message.id}")
  end

  it "uses the message body when a reminder has no note" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Ping").value
    row = MessageReminders::Create.call(account: user.account, message: message, remind_at: 1.hour.from_now).value
    expect(described_class.for_reminder(reminder: row).fetch("body")).to eq("Ping")
  end

  it "uses reminder catalog copy when the note and body are blank" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "X").value
    row = MessageReminders::Create.call(account: user.account, message: message, remind_at: 1.hour.from_now).value
    message.update_columns(body: "")
    payload = described_class.for_reminder(reminder: row.reload)

    expect(payload.fetch("body")).to eq(Catalog.t("push.reminder.body"))
  end
end
