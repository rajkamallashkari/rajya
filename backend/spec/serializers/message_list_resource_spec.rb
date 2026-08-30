require "rails_helper"

RSpec.describe MessageListResource do
  it "wraps messages" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    json = described_class.new(Messages::List.new(messages: [ message ])).to_h

    expect(json.fetch("messages").sole.fetch("id")).to eq(message.id)
  end
end
