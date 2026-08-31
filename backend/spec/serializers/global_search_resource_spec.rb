require "rails_helper"

RSpec.describe GlobalSearchResource do
  def payload(user, conversation, message)
    Search::GlobalPayload.new(
      query: "he",
      messages: [ Search::MessageHit.new(message: message, snippet: "hello", can_forward: true) ],
      accounts: [ user.account ],
      conversations: [ Search::ConversationHit.new(id: conversation.id, title: "Chat", kind: "direct") ]
    )
  end

  it "serializes query, message hits, accounts, and conversations" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = create(:message, conversation: conversation, sender_account: user.account, body: "hello")
    json = described_class.new(payload(user, conversation, message)).to_h

    expect(json.fetch("query")).to eq("he")
    expect(json.fetch("messages").sole.fetch("message_id")).to eq(message.id)
    expect(json.fetch("conversations").sole.fetch("title")).to eq("Chat")
  end

  it "omits sender_name when the message has no sender" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = create(
      :message, conversation: conversation, sender_account: nil, kind: "system",
                system_event: "member_added", body: "joined"
    )
    json = described_class.new(payload(user, conversation, message)).to_h

    expect(json.fetch("messages").sole.fetch("sender_name")).to be_nil
  end
end
