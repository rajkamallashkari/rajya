require "rails_helper"

RSpec.describe MessageResource do
  def send_from(user, conversation, **attrs)
    Messages::Send.call(conversation: conversation, sender: user.account, **attrs).value
  end

  it "serializes a live message with sender and empty attachments" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = send_from(user, conversation, body: "Hi")
    json = described_class.new(message).to_h

    expect(json).to include("id" => message.id, "body" => "Hi", "deleted" => false, "kind" => "text")
    expect(json.fetch("sender").fetch("id")).to eq(user.account.id)
    expect(json.fetch("attachments")).to eq([])
    expect(json.fetch("silent")).to be(false)
  end

  it "omits the body of a tombstone and keeps the sender snapshot (BR-8)" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    parent = send_from(user, conversation, body: "Root")
    Messages::Unsend.call(message: parent, actor: user.account)
    reply = send_from(user, conversation, body: "Re", reply_to_message_id: parent.id)
    json = described_class.new(reply).to_h

    expect(json.fetch("reply_to")).to include("id" => parent.id, "deleted" => true)
    expect(described_class.new(parent.reload).to_h).to include("body" => nil, "deleted" => true, "poll" => nil)
  end

  it "includes a live reply snippet and attachment metadata" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    parent = send_from(user, conversation, body: "Root")
    child = send_from(user, conversation, body: "Re", reply_to_message_id: parent.id)
    with_file = send_from(user, conversation, attachment_signed_ids: [ blob_signed_id ])

    expect(described_class.new(child).to_h.fetch("reply_to")).to include("body" => "Root", "deleted" => false)
    expect(described_class.new(with_file).to_h.fetch("attachments").first).to include("kind" => "image")
  end

  it "embeds location and contacts on a live message" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = send_from(
      user, conversation,
      location: { latitude: "12.97", longitude: "77.59", accuracy_m: 5, label: "Cafe" },
      contacts: [ { display_name: "Ada", email: "ada@example.com" } ]
    )
    json = described_class.new(message).to_h

    expect(json.fetch("location")).to include("label" => "Cafe", "accuracy_m" => 5)
    expect(json.fetch("contacts").first).to include("display_name" => "Ada", "email" => "ada@example.com")
  end

  it "includes tick state for the sender" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = send_from(user, conversation, body: "Hi")
    json = described_class.new(message, params: { current_account: user.account }).to_h

    expect(json.fetch("tick")).to eq("sent")
  end

  it "omits tick state on an incoming message" do
    sender = create(:user)
    peer = create(:user)
    conversation = create_direct_between(sender.account, peer.account)
    message = send_from(sender, conversation, body: "Hi")
    json = described_class.new(message, params: { current_account: peer.account }).to_h

    expect(json.fetch("tick")).to be_nil
  end
end
