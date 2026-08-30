require "rails_helper"

RSpec.describe MessagePageResource do
  it "snapshots the page envelope and serializes messages in order" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = create(:message, conversation: conversation, sender_account: user.account, position: 1, body: "Hi")
    json = described_class.new(Messages::Page.call(scope: conversation.messages)).to_h

    expect(json.keys).to contain_exactly("messages", "meta")
    expect(json.fetch("meta").keys).to contain_exactly(
      "has_more_before", "has_more_after", "oldest_position", "newest_position", "pivot_id"
    )
    expect(json.fetch("messages").sole).to include("id" => message.id, "body" => "Hi")
    expect(json.fetch("meta")).to include("has_more_before" => false, "pivot_id" => nil)
  end
end
