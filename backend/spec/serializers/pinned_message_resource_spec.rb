require "rails_helper"

RSpec.describe PinnedMessageResource do
  it "embeds the message payload" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    pin = Messages::Pin.call(message: message, actor: user.account).value
    json = described_class.new(pin).to_h

    expect(json).to include("id" => pin.id, "message_id" => message.id)
    expect(json.fetch("message").fetch("body")).to eq("Hi")
  end
end
