require "rails_helper"

RSpec.describe SavedMessageListResource do
  it "wraps saved messages" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    saved = Messages::Save.call(message: message, actor: user.account).value
    json = described_class.new(Messages::SavedList.new(saved_messages: [ saved ])).to_h

    expect(json.fetch("saved_messages").sole.fetch("message_id")).to eq(message.id)
  end
end
