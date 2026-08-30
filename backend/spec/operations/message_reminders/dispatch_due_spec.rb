require "rails_helper"

RSpec.describe MessageReminders::DispatchDue do
  it "dispatches due pending reminders" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    row = MessageReminders::Create.call(account: user.account, message: message, remind_at: 1.hour.from_now).value
    row.update_columns(remind_at: 1.minute.ago)

    described_class.call
    expect(row.reload).to be_completed
  end
end
