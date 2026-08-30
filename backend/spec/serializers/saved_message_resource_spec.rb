require "rails_helper"

RSpec.describe SavedMessageResource do
  it "embeds the saved message" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    saved = Messages::Save.call(message: message, actor: user.account).value
    json = described_class.new(saved).to_h

    expect(json.fetch("message_id")).to eq(message.id)
    expect(json.fetch("message").fetch("body")).to eq("Hi")
  end
end
