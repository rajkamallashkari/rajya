require "rails_helper"

RSpec.describe Messages::Show do
  it "returns the message for permalink resolution (NR-19)" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value

    expect(described_class.call(message: message).value).to eq(message)
  end
end
