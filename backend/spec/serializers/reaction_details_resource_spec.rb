require "rails_helper"

RSpec.describe ReactionDetailsResource do
  it "lists emoji with accounts" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    Messages::React.call(message: message, actor: user.account, emoji: "👍")
    list = Messages::ReactionDetails.call(message: message).value
    json = described_class.new(list).to_h

    expect(json.fetch("reactions").sole).to include("emoji" => "👍")
    expect(json.fetch("reactions").sole.fetch("account").fetch("id")).to eq(user.account.id)
  end
end
