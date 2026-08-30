require "rails_helper"

RSpec.describe Messages::ReactionDetails do
  it "returns reactions with accounts over the existing table (NR-27)" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    Messages::React.call(message: message, actor: user.account, emoji: "👍")
    result = described_class.call(message: message)

    expect(result.value.reactions.sole).to have_attributes(emoji: "👍", account_id: user.account.id)
  end
end
