require "rails_helper"

RSpec.describe ConversationSearchResource do
  it "serializes in-chat hits" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = create(:message, conversation: conversation, sender_account: user.account, body: "hello")
    json = described_class.new(
      Search::ConversationPayload.new(
        query: "he",
        messages: [ Search::MessageHit.new(message: message, snippet: "hello", can_forward: false) ]
      )
    ).to_h

    expect(json.fetch("messages").sole.fetch("can_forward")).to be(false)
  end
end
