require "rails_helper"

RSpec.describe MessageReminders::Cancel do
  it "destroys the owner's reminder" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    row = MessageReminders::Create.call(account: user.account, message: message, remind_at: 1.hour.from_now).value
    described_class.call(reminder: row, actor: user.account)

    expect(MessageReminder.where(id: row.id)).not_to exist
  end

  it "forbids another account" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    row = MessageReminders::Create.call(account: user.account, message: message, remind_at: 1.hour.from_now).value

    expect(described_class.call(reminder: row, actor: create(:user).account).error_code).to eq(:forbidden)
  end
end
