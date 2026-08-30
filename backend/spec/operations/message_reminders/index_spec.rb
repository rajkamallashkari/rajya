require "rails_helper"

RSpec.describe MessageReminders::Index do
  it "lists pending reminders for the account" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    pending = MessageReminders::Create.call(account: user.account, message: message, remind_at: 1.hour.from_now).value
    done = MessageReminders::Create.call(
      account: user.account,
      message: Messages::Send.call(conversation: conversation, sender: user.account, body: "Two").value,
      remind_at: 2.hours.from_now
    ).value
    done.update!(completed_at: Time.current)

    result = described_class.call(account: user.account, message_reminders: MessageReminder.all)

    expect(result.value.message_reminders).to eq([ pending ])
  end
end
