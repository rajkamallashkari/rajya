require "rails_helper"

RSpec.describe MessageReminders::Dispatch do
  it "marks the reminder complete and publishes once" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    row = MessageReminders::Create.call(account: user.account, message: message, remind_at: 1.hour.from_now).value
    allow(Realtime).to receive(:publish)

    described_class.call(reminder: row)
    described_class.call(reminder: row.reload)

    expect(row.reload).to be_completed
    expect(Realtime).to have_received(:publish).once
  end
end
