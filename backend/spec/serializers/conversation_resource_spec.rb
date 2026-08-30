require "rails_helper"

RSpec.describe ConversationResource do
  def group_json
    owner = create(:user)
    member = create(:account)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ member ])
    conversation.update!(description: "About")
    message = create(:message, conversation: conversation, body: "Hi")
    conversation.update!(last_message: message)
    json = described_class.new(
      Conversations::Show.call(account: owner.account, conversation: conversation).value
    ).to_h
    [ json, conversation, owner, member, message ]
  end

  it "serializes a group with members and omits a peer" do
    json, conversation, owner, member, _message = group_json

    expect(json).to include(
      "id" => conversation.id,
      "kind" => "group",
      "title" => conversation.title,
      "description" => "About",
      "role" => "owner",
      "peer" => nil,
      "unread_count" => 0
    )
    expect(json.fetch("members").map { |row| row.fetch("account").fetch("id") })
      .to contain_exactly(owner.account.id, member.id)
  end

  it "includes a last_message preview when one exists" do
    json, _conversation, _owner, _member, message = group_json
    expect(json.fetch("last_message")).to include(
      "id" => message.id, "body" => "Hi", "kind" => "text", "deleted" => false,
      "sender_name" => message.sender_account.display_name
    )
  end

  it "omits the body of a deleted last_message (BR-8)" do
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    message = create(:message, conversation: conversation, sender_account: owner.account, body: "Hi")
    Messages::Unsend.call(message: message, actor: owner.account)
    conversation.update!(last_message: message)
    json = described_class.new(Conversations::View.for(conversation.reload, owner.account)).to_h

    expect(json.fetch("last_message")).to include("id" => message.id, "body" => nil, "deleted" => true)
  end

  it "omits sender_name when the last message has no sender account" do
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    message = create(:message, conversation: conversation, sender_account: nil, sender_snapshot: { "display_name" => "Ghost" })
    conversation.update!(last_message: message)
    json = described_class.new(Conversations::View.for(conversation.reload, owner.account)).to_h

    expect(json.fetch("last_message")).to include("id" => message.id, "sender_name" => nil)
  end

  it "serializes a direct with the other account as peer and no members on the list view" do
    alice = create(:user)
    bob = create(:account)
    conversation = create_direct_between(alice.account, bob)
    json = described_class.new(Conversations::View.for(conversation, alice.account)).to_h

    expect(json.fetch("peer").fetch("id")).to eq(bob.id)
    expect(json.fetch("members")).to eq([])
    expect(json.fetch("title")).to be_nil
  end

  it "uses the viewer as peer for a self-chat" do
    account = create(:user).account
    conversation = create_direct_between(account)
    json = described_class.new(Conversations::View.for(conversation, account, include_members: true)).to_h

    expect(json.fetch("peer").fetch("id")).to eq(account.id)
    expect(json.fetch("members").size).to eq(1)
  end

  it "zeros counters when the viewer has no membership and last_message is missing" do
    conversation = create(:conversation)
    json = described_class.new(Conversations::View.for(conversation, create(:user).account)).to_h

    expect(json).to include(
      "unread_count" => 0,
      "role" => nil,
      "last_message" => nil,
      "pinned_at" => nil,
      "manually_unread_at" => nil
    )
  end
end
