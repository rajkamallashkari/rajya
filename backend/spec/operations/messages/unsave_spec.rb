require "rails_helper"

RSpec.describe Messages::Unsave do
  it "removes the save" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    Messages::Save.call(message: message, actor: user.account)

    expect(described_class.call(message: message, actor: user.account)).to be_success
    expect(SavedMessage.where(account: user.account, message: message)).not_to exist
  end

  it "returns not_found when unsaved and forbids a stranger" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value

    expect(described_class.call(message: message, actor: user.account).error_code).to eq(:not_found)
    expect(described_class.call(message: message, actor: create(:user).account).error_code).to eq(:forbidden)
  end
end
