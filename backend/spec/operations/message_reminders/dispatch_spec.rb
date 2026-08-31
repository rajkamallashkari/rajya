require "rails_helper"

RSpec.describe MessageReminders::Dispatch do
  include ActiveSupport::Testing::TimeHelpers

  def reminder_for(timezone:, at:, note: nil)
    user = create(:user)
    create(:preference, account: user.account, data: { "locale" => { "timezone" => timezone } })
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    row = MessageReminders::Create.call(
      account: user.account.reload, message: message, remind_at: at, note: note
    ).value
    [ user, row ]
  end

  it "marks the reminder complete and publishes once" do
    _user, row = reminder_for(timezone: "UTC", at: 1.hour.from_now)
    allow(Realtime).to receive(:publish)
    allow(Push::DeliveryChannel).to receive(:deliver)

    described_class.call(reminder: row)
    described_class.call(reminder: row.reload)

    expect(row.reload).to be_completed
    expect(Realtime).to have_received(:publish).once
  end

  it "sends a web push through the delivery channel" do
    user, row = reminder_for(timezone: "UTC", at: 1.hour.from_now, note: "Ping")
    allow(Push::DeliveryChannel).to receive(:deliver).and_return(true)

    described_class.call(reminder: row)

    expect(Push::DeliveryChannel).to have_received(:deliver).with(
      account: user.account, payload: hash_including("body" => "Ping")
    )
  end

  it "skips push for an account without a user" do
    _user, row = reminder_for(timezone: "UTC", at: 1.hour.from_now)
    row.account.user.destroy!
    allow(Push::DeliveryChannel).to receive(:deliver)
    described_class.call(reminder: row.reload)
    expect(Push::DeliveryChannel).not_to have_received(:deliver)
  end
end
