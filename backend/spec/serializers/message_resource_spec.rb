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
  end

  it "omits the body of a tombstone and keeps the sender snapshot (BR-8)" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    parent = send_from(user, conversation, body: "Root")
    Messages::Unsend.call(message: parent, actor: user.account)
    reply = send_from(user, conversation, body: "Re", reply_to_message_id: parent.id)
    json = described_class.new(reply).to_h

    expect(json.fetch("reply_to")).to include("id" => parent.id, "deleted" => true)
    expect(described_class.new(parent.reload).to_h).to include("body" => nil, "deleted" => true)
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
end
