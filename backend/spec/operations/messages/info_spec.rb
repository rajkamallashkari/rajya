require "rails_helper"

RSpec.describe Messages::Info do
  it "wraps the watermarks query" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = create(:message, conversation: conversation, sender_account: user.account, position: 1)
    result = described_class.call(message: message)

    expect(result).to be_success
    expect(result.value.delivered).to eq([])
    expect(result.value.read).to eq([])
  end
end
