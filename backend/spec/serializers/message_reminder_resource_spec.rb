require "rails_helper"

RSpec.describe MessageReminderResource do
  it "serializes reminder fields" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = create(:message, conversation: conversation, sender_account: user.account)
    row = create(:message_reminder, account: user.account, message: message, note: "Ping")
    json = described_class.new(row).to_h

    expect(json).to include("id" => row.id, "message_id" => message.id, "note" => "Ping")
  end
end
