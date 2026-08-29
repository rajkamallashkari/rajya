require "rails_helper"

RSpec.describe ConversationListResource do
  it "wraps conversations for the viewer" do
    user = create(:user)
    conversation = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    json = described_class.new(
      Conversations::List.new(conversations: [ conversation ], viewer: user.account)
    ).to_h

    expect(json.fetch("conversations").sole.fetch("id")).to eq(conversation.id)
    expect(json.fetch("conversations").sole.fetch("role")).to eq("owner")
  end
end
