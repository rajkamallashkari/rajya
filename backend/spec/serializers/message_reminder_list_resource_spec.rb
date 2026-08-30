require "rails_helper"

RSpec.describe MessageReminderListResource do
  it "wraps reminders" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = create(:message, conversation: conversation, sender_account: user.account)
    row = create(:message_reminder, account: user.account, message: message)
    json = described_class.new(MessageReminders::List.new(message_reminders: [ row ])).to_h

    expect(json.fetch("message_reminders").sole.fetch("id")).to eq(row.id)
  end
end
